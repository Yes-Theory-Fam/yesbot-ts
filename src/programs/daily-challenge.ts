import { Timer } from "@prisma/client";
import Axios from "axios";
import Discord, {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  Client,
  Colors,
  TextChannel,
} from "discord.js";
import bot from "..";
import { ChatNames } from "../collections/chat-names";
import Tools from "../common/tools";
import { Command, CommandHandler, DiscordEvent } from "../event-distribution";
import { createYesBotLogger } from "../log";
import prisma from "../prisma";
import { TimerService } from "./timer/timer.service";

const dailyChallengeIdentifier = "dailychallenge";

const logger = createYesBotLogger("programs", "dailyChallenge");

const UTC_HOUR_POSTED = 8;

@Command({
  event: DiscordEvent.SLASH_COMMAND,
  root: "challenge",
  description: "Have a look at the current challenge!",
})
class DailyChallengeCommand
  implements CommandHandler<DiscordEvent.SLASH_COMMAND>
{
  async handle(interaction: ChatInputCommandInteraction): Promise<void> {
    const compare = new Date();
    compare.setUTCHours(compare.getUTCHours() - 48 - UTC_HOUR_POSTED);

    const res = await prisma.dailyChallenge.findFirst({
      where: {
        lastUsed: {
          gte: compare.toISOString(),
        },
      },
    });

    await interaction.reply(
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
    const dailyChallengeChannel = guild?.channels.cache.find(
      (channel) => channel.name === ChatNames.DAILY_CHALLENGE
    ) as TextChannel;

    const res = await prisma.dailyChallenge.findFirst({
      orderBy: { lastUsed: "asc" },
    });

    if (!res) return;

    const embed = new Discord.EmbedBuilder()
      .setColor(Colors.Blue)
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

    await dailyChallengeChannel.send({ embeds: [embed] });
    await Tools.forcePingGroup("dailychallenge", dailyChallengeChannel);

    await startDailyChallengeTimer(dailyChallengeIdentifier);
  }
}

@Command({
  event: DiscordEvent.SLASH_COMMAND,
  root: "add-challenges",
  description: "Add more daily challenges",
  options: [
    {
      name: "challenges",
      type: ApplicationCommandOptionType.Attachment,
      description: "A file with one challenge per line",
      required: true,
    },
  ],
})
class SaveToDB implements CommandHandler<DiscordEvent.SLASH_COMMAND> {
  async handle(interaction: ChatInputCommandInteraction) {
    const challenges = interaction.options.getAttachment("challenges")!;

    try {
      const file = await Axios.get(challenges.url);
      const bulkChallenges: string[] = file.data.split("\n");
      const bulkInsert = bulkChallenges.map((challenge) => ({
        result: challenge.trim(),
      }));

      await prisma.dailyChallenge.createMany({ data: bulkInsert });
      await interaction.reply(
        `Added ${bulkInsert.length} new daily challenges!`
      );
    } catch (err) {
      logger.error("There was an error getting the attached file: ", err);
      await interaction.reply(`Could not add the challenges.`);
    }
  }
}

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
