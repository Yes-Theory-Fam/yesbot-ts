import Axios from "axios";
import Discord, { Client, Message, TextChannel } from "discord.js";
import { createYesBotLogger } from "../log";
import { ChatNames } from "../collections/chat-names";
import prisma from "../prisma";
import { Command, CommandHandler, DiscordEvent } from "../event-distribution";
import { Timer } from "@yes-theory-fam/database/client";
import bot from "..";
import { TimerService } from "./timer/timer.service";

const dailyChallengeIdentifier = "dailychallenge";

const logger = createYesBotLogger("programs", "dailyChallenge");

const UTC_HOUR_POSTED = 8;

@Command({
  event: DiscordEvent.MESSAGE,
  trigger: "!challenge",
  channelNames: ["daily-challenge"],
  description:
    "This handler is for when a user wants to know the current Daily Challenge.",
})
class DailyChallengeCommand implements CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message): Promise<void> {
    const compare = new Date();
    compare.setUTCHours(compare.getUTCHours() - 48 - UTC_HOUR_POSTED);

    const res = await prisma.dailyChallenge.findFirst({
      where: {
        lastUsed: {
          gte: compare.toISOString(),
        },
      },
    });

    await message.channel.send(
      res?.result ?? "We don't have a challenge for today, come back tomorrow!"
    );
  }
}

@Command({
  event: DiscordEvent.READY,
  description: "This handler is to kickstart the Daily Challenge timer.",
})
class DailyChallengeTimerKickStart
  implements CommandHandler<DiscordEvent.READY>
{
  async handle(bot: Client): Promise<void> {
    const hasDailyChallengeStarted = await prisma.timer.findFirst({
      where: {
        handlerIdentifier: dailyChallengeIdentifier,
      },
    });

    if (hasDailyChallengeStarted) {
      return;
    }

    await startDailyChallengeTimer(dailyChallengeIdentifier);
  }
}

@Command({
  event: DiscordEvent.TIMER,
  handlerIdentifier: dailyChallengeIdentifier,
  description: "This handler is to post the Daily Challenge every 48 hours.",
})
class PostDailyChallenge implements CommandHandler<DiscordEvent.TIMER> {
  async handle(timer: Timer) {
    const guild = bot.guilds.resolve(process.env.GUILD_ID);
    const DailyChallengeChannel = guild.channels.cache.find(
      (channel) => channel.name === ChatNames.DAILY_CHALLENGE
    ) as TextChannel;

    const res = await prisma.dailyChallenge.findFirst({
      orderBy: { lastUsed: "asc" },
    });

    if (res) {
      const embed = new Discord.MessageEmbed()
        .setColor("BLUE")
        .setTitle("YesFam Daily Challenge!")
        .setDescription(res.result);

      try {
        const used = new Date();
        used.setUTCHours(0, 0, 0, 0);
        res.lastUsed = used;
        await prisma.dailyChallenge.update({
          where: { id: res.id },
          data: res,
        });
      } catch (err) {
        logger.error(
          "(postDailyMessage) There was an error posting Daily Challenge: ",
          err
        );
      }

      await DailyChallengeChannel.send("@group dailychallenge");
      await DailyChallengeChannel.send(embed);

      await startDailyChallengeTimer(dailyChallengeIdentifier);
    }
  }
}

@Command({
  event: DiscordEvent.MESSAGE,
  allowedRoles: ["Support"],
  trigger: "!addChallenge",
  description: "This handler is to add challenges to the DB",
})
class SaveToDB implements CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message) {
    const words = message.content.split(/\s+/);
    const tableName = words[1];
    const info = words.slice(2).join(" ");

    if (tableName === "daily-challenge") {
      // Check if its an attachment:
      const attachment = message.attachments?.first();
      if (attachment) {
        try {
          const file = await Axios.get(attachment.url);
          const bulkChallenges: string[] = file.data.split("\n");
          const bulkInsert = bulkChallenges.map((challenge) => ({
            result: challenge.trim(),
          }));
          await save(bulkInsert, message);
        } catch (err) {
          logger.error("There was an error getting the attached file: ", err);
          await message.react("👎");
        }
      } else {
        const res = { result: info };
        await save(res, message);
        await message.react("👍");
      }
    }
  }
}

type ChallengeInsert = { result: string };

const save = async (
  res: ChallengeInsert | ChallengeInsert[],
  message: Message
) => {
  try {
    if (Array.isArray(res)) {
      await prisma.dailyChallenge.createMany({ data: res });
    } else {
      await prisma.dailyChallenge.create({ data: res });
    }
  } catch (err) {
    logger.error("There was an error saving to the DB: ", err);
    await message.react("👎");
  }
};

const startDailyChallengeTimer = async (identifier: string) => {
  const msDay = 24 * 60 * 60 * 1000;
  const executeTime = new Date();
  let executionDate = 2;
  if (Math.floor(Date.now() / msDay) % 2) {
    executionDate = 1;
  }

  executeTime.setUTCHours(UTC_HOUR_POSTED, 0, 0);
  executeTime.setDate(executeTime.getDate() + executionDate);
  await TimerService.createTimer(identifier, executeTime);
};
