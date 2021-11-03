import { PrismaPromise } from "@yes-theory-fam/database/client";
import { Client, Guild, Message, Snowflake, TextChannel } from "discord.js";
import { evenQuestions, intro, oddQuestions } from "./texts";
import { createYesBotLogger } from "../../../log";
import { ChatNames } from "../../../collections/chat-names";
import prisma from "../../../prisma";
import cron from "node-cron";

// TODO, throw members with disabled DMs out of matching until they hit a reaction in the disabled DMs channel?

const matchAmount = 100;
const cronSchedule = "*/30 * * * *"; // Every 30 minutes

const shuffle = <T>(...items: T[]): T[] => {
  const copy = [...items];
  let currentIndex = items.length;

  while (currentIndex !== 0) {
    const randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    [copy[currentIndex], copy[randomIndex]] = [
      copy[randomIndex],
      copy[currentIndex],
    ];
  }

  return copy;
};

const partition = <T>(chunkSize = 2, ...items: T[]): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    chunks.push(chunk);
  }

  return chunks;
};

export class BuddyProjectMatching {
  constructor(private guild: Guild) {}

  static init(bot: Client) {
    const targetGuild = bot.guilds.resolve(process.env.GUILD_ID);

    cron.schedule(cronSchedule, () =>
      new BuddyProjectMatching(targetGuild).runMatching()
    );
  }

  async runMatching(): Promise<void> {
    const availableIds = await prisma.buddyProjectEntry.findMany({
      select: { userId: true },
      where: { buddyId: null },
    });

    const shuffledIds = shuffle(...availableIds.map(({ userId }) => userId));
    const idsToMatch = shuffledIds.slice(0, matchAmount);
    const pairs = partition(2, ...idsToMatch);

    logger.debug(`Matching ${pairs.length} pairs!`);

    const matchingPromises = pairs
      .filter((p) => p.length === 2)
      .map((p) =>
        BuddyProjectMatching.match(p as [string, string], this.guild)
      );

    await Promise.all(matchingPromises);
    logger.info("Done matching, destroying client in 3 seconds.");
  }

  private static matchWith(
    userId: string,
    buddyId: string
  ): PrismaPromise<unknown> {
    return prisma.buddyProjectEntry.update({
      where: { userId },
      data: { buddyId, matchedDate: new Date() },
    });
  }

  private static async match(
    [first, second]: [Snowflake, Snowflake],
    guild: Guild
  ): Promise<void> {
    logger.debug(`Matching ${first} with ${second}`);
    const matchA = BuddyProjectMatching.matchWith(first, second);
    const matchB = BuddyProjectMatching.matchWith(second, first);
    try {
      logger.debug("Updating database");
      await prisma.$transaction([matchA, matchB]);

      const firstSentMessage = await BuddyProjectMatching.trySendQuestions(
        first,
        `${intro}\n${oddQuestions}`,
        guild
      );

      if (!firstSentMessage) {
        await BuddyProjectMatching.rollbackMatch([first, second]);
        return;
      }

      const secondSentMessage = await BuddyProjectMatching.trySendQuestions(
        second,
        `${intro}\n${evenQuestions}`,
        guild
      );

      if (secondSentMessage) return; // all is well, both parties received their questions

      await BuddyProjectMatching.rollbackMatch([first, second]);
      await firstSentMessage.delete();
      await firstSentMessage.channel.send(
        "Right, this one is going to be disappointing... I had already matched you " +
          "but your match had their DMs disabled, so I had to rollback everything.\n\n" +
          "This message was sent to make sure you are not left wondering why I sent you a message that suddenly vanished. " +
          "Don't worry, you are still signed up and will be matched soon (that time with better luck though)!"
      );
    } catch (e) {
      logger.error("Error while matching: ", e);
    }
  }

  private static async trySendQuestions(
    userId: string,
    questions: string,
    guild: Guild
  ): Promise<Message | undefined> {
    logger.debug(`Sending questions to ${userId}`);
    const member = await guild.members.fetch(userId);
    const dm = await member.createDM();
    try {
      return await dm.send(questions);
    } catch (e) {
      // Assume that they have DMs disabled.

      logger.error("Could not send DMs", e);
      const disabledDmsChannel = guild.channels.cache.find(
        (c): c is TextChannel => c.name === ChatNames.BUDDY_PROJECT_DMS_DISABLED
      );
      if (!disabledDmsChannel) {
        const message = "Could not find disabled DMs channel";
        logger.error(message);
        throw new Error(message);
      }

      await disabledDmsChannel.permissionOverwrites.edit(userId, {
        VIEW_CHANNEL: true,
        SEND_MESSAGES: false,
      });

      const ping = await disabledDmsChannel.send({
        content: `<@${userId}>`,
        allowedMentions: { users: [userId] },
      });

      await ping.delete();
    }
  }

  private static async rollbackMatch(ids: [string, string]): Promise<void> {
    await prisma.buddyProjectEntry.updateMany({
      data: { buddyId: null },
      where: { userId: { in: ids } },
    });
  }
}

const logger = createYesBotLogger("buddy-project", BuddyProjectMatching.name);
