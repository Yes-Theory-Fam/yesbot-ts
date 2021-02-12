import Axios from "axios";
import Discord, { Client, Message, TextChannel } from "discord.js";
import { Repository } from "typeorm";
import { Logger } from "../common/Logger";
import { DailyChallenge, DailyChallengeRepository } from "../entities";

export const dailyChallengeChannelId = "474197374684758025";

export default async function SendFromDB(
  pMessage: Message,
  channelName: string
) {
  let repo = undefined;
  if (channelName === "daily-challenge") {
    repo = await DailyChallengeRepository();
  }

  if (repo) {
    const compare = new Date();
    compare.setUTCHours(compare.getUTCHours() - 48 - 8);

    const res = await repo
      .createQueryBuilder()
      .select()
      .where("last_used > :today", {
        today: compare.toISOString(),
      })
      .getOne();

    pMessage.channel.send(
      res?.result ?? "We don't have a challenge for today, come back tomorrow!"
    );
  } else {
    pMessage.reply(
      `We're sorry, Yesbot had a hiccup. Here's a cookie instead: 🍪`
    );
  }
}

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
        "SendFromDB",
        "postDailyMessage",
        "There was an error posting Daily Challenge: " + err
      );
    }
    if (message) {
      message.reply(embed);
    } else if (messageChannel) {
      if (withPing) {
        messageChannel.send("@group dailychallenge");
      }
      messageChannel.send(embed);
    }
  }
};

export const saveToDb = async (
  tableName: string,
  info: string,
  pMessage: Message
) => {
  let repo: Repository<DailyChallenge> = undefined;
  if (tableName === "daily-challenge") {
    repo = await DailyChallengeRepository();

    // Check if its an attachment:
    const attachment = pMessage.attachments?.first();
    if (attachment) {
      try {
        const file = await Axios.get(attachment.url);
        const bulkChallenges: [] = file.data.split("\n");
        bulkChallenges.forEach(async (challenge: string, idx: number) => {
          let res = new DailyChallenge();
          res.result = challenge.trim();
          await save(repo, res, pMessage);
          if (idx === bulkChallenges.length - 1) {
            pMessage.react("👍");
          }
        });
      } catch (err) {
        console.log(
          "[ERROR] SendFromDB - There was an error getting the attached file: ",
          err
        );
        pMessage.react("👎");
      }
    } else {
      let res = new DailyChallenge();
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
    Logger("SendFromDB", "save", "There was an error saving to DB: " + err);
    pMessage.react("👎");
  }
};
