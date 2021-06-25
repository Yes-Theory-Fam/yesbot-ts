import Axios from "axios";
import Discord, { Client, Message, TextChannel } from "discord.js";
import { createYesBotLogger } from "../log";
import { ChatNames } from "../collections/chat-names";
import prisma from "../prisma";

const logger = createYesBotLogger("programs", "dailyChallenge");

const UTC_HOUR_POSTED = 8;

export const dailyChallenge = async (message: Message) => {
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
};

export const initialize = async (discordClient: Client) => {
  let now = new Date();
  let firstRun = new Date();
  firstRun.setUTCHours(UTC_HOUR_POSTED, 0, 0, 0);
  if (now.getUTCHours() >= UTC_HOUR_POSTED) {
    // schedule for the next day - 8AM
    firstRun.setUTCDate(firstRun.getUTCDate() + 1);
  }
  let timeDiff = firstRun.getTime() - Date.now();

  const msDay = 24 * 60 * 60 * 1000; // 24 hours
  const checkAndPost = () => {
    const shouldPost = !(Math.floor(Date.now() / msDay) % 2);
    if (shouldPost) {
      postDailyMessage(discordClient, undefined, true);
    }
  };

  setTimeout(() => {
    checkAndPost();
    // Set an interval for each next day
    setInterval(checkAndPost, msDay);
  }, timeDiff);
};

export const postDailyMessage = async (
  bot: Client,
  message?: Message,
  withPing: boolean = false
) => {
  let messageChannel = <TextChannel>(
    bot.channels.resolve(
      message.guild.channels.cache.find(
        (channel) => channel.name === ChatNames.DAILY_CHALLENGE
      ).id
    )
  );
  const res = await prisma.dailyChallenge.findFirst({
    orderBy: { lastUsed: "asc" },
  });

  if (res) {
    const embed = new Discord.MessageEmbed()
      .setColor("BLUE")
      .setTitle("YesFam Daily Challenge!")
      .setDescription(res.result);

    const used = new Date();
    used.setUTCHours(0, 0, 0, 0);
    res.lastUsed = used;

    try {
      await prisma.dailyChallenge.update({ where: { id: res.id }, data: res });
    } catch (err) {
      logger.error(
        "(postDailyMessage) There was an error posting Daily Challenge: ",
        err
      );
    }
    if (message) {
      await message.reply(embed);
    } else if (messageChannel) {
      if (withPing) {
        await messageChannel.send("@group dailychallenge");
      }
      await messageChannel.send(embed);
    }
  }
};

export const saveToDb = async (
  tableName: string,
  info: string,
  message: Message
) => {
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
};

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
