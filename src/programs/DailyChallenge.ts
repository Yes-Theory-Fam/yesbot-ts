import Axios from "axios";
import Discord, { Client, Message, TextChannel } from "discord.js";
import { Repository } from "typeorm";
import { Logger } from "../common/Logger";
import {
  DailyChallenge as DailyChallengeEntity,
  DailyChallengeRepository,
} from "../entities";
import { createYesBotLogger } from "../log";

const logger = createYesBotLogger("programs", "DailyChallenge");

export const dailyChallengeChannelId = "474197374684758025";
const UTC_HOUR_POSTED = 8;

export const DailyChallenge = async (message: Message) => {
  let repo = await DailyChallengeRepository();

  const compare = new Date();
  compare.setUTCHours(compare.getUTCHours() - 48 - UTC_HOUR_POSTED);

  const res = await repo
    .createQueryBuilder()
    .select()
    .where("last_used > :today", {
      today: compare.toISOString(),
    })
    .getOne();

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
    bot.channels.resolve(dailyChallengeChannelId)
  );
  const repo = await DailyChallengeRepository();
  const res = await repo
    .createQueryBuilder()
    .select()
    // .andWhere("random() < 0.5 OR id = 1")
    .orderBy("last_used", "ASC")
    .limit(1)
    .getOne();
  if (res) {
    const embed = new Discord.MessageEmbed()
      .setColor("BLUE")
      .setTitle("YesFam Daily Challenge!")
      .setDescription(res.result);

    const used = new Date();
    used.setUTCHours(0, 0, 0, 0);
    res.lastUsed = used;

    try {
      await repo.save(res);
    } catch (err) {
      Logger(
        "DailyChallenge",
        "postDailyMessage",
        "There was an error posting Daily Challenge: " + err
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
  pMessage: Message
) => {
  let repo: Repository<DailyChallengeEntity> = undefined;
  if (tableName === "daily-challenge") {
    repo = await DailyChallengeRepository();

    // Check if its an attachment:
    const attachment = pMessage.attachments?.first();
    if (attachment) {
      try {
        const file = await Axios.get(attachment.url);
        const bulkChallenges: [] = file.data.split("\n");
        bulkChallenges.forEach(async (challenge: string, idx: number) => {
          let res = new DailyChallengeEntity();
          res.result = challenge.trim();
          await save(repo, res, pMessage);
          if (idx === bulkChallenges.length - 1) {
            pMessage.react("👍");
          }
        });
      } catch (err) {
        logger.error("There was an error getting the attached file: ", err);
        pMessage.react("👎");
      }
    } else {
      let res = new DailyChallengeEntity();
      res.result = info;
      await save(repo, res, pMessage);
      pMessage.react("👍");
    }
  }
};

const save = async (repo: any, res: any, pMessage: Message) => {
  try {
    await repo.save(res);
  } catch (err) {
    Logger("DailyChallenge", "save", "There was an error saving to DB: " + err);
    pMessage.react("👎");
  }
};
