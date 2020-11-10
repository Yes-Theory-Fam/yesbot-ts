import Axios from "axios";
import Discord, { Client, Message, TextChannel } from "discord.js";
import { Repository } from "typeorm";
import { Logger } from "../common/Logger";
import { DailyChallenge, DailyChallengeRepository } from "../entities";

export default async function SendFromDB(
  pMessage: Message,
  channelName: string
) {
  let repo = undefined;
  if (channelName === "daily-challenge") {
    repo = await DailyChallengeRepository();
  }

  if (repo) {
    const res = await repo
      .createQueryBuilder("topic")
      .where("topic.last_used = :currentDate", { currentDate: new Date() })
      .getOne();

    pMessage.channel.send(res.result);
  } else {
    pMessage.reply(
      `We're sorry, Yesbot had a hiccup. Here's a cookie instead: 🍪`
    );
  }
}

export const postDailyMessage = async (bot: Client) => {
  const messageChannel = <TextChannel>(
    bot.channels.resolve("474197374684758025")
  );
  const repo = await DailyChallengeRepository();
  if (messageChannel) {
    const res = await repo
      .createQueryBuilder()
      .select()
      .andWhere("random() < 0.5 OR id = 1")
      .orderBy("last_used", "ASC")
      .limit(1)
      .getOne();
    if (res) {
      const embed = new Discord.MessageEmbed()
        .setColor("BLUE")
        .setTitle("YesFam Daily Challenge!")
        .setDescription(res.result);

      res.lastUsed = new Date();
      try {
        await repo.save(res);
      } catch (err) {
        Logger(
          "SendFromDB",
          "postDailyMessage",
          "There was an error posting Daily Challenge: " + err
        );
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
        const bulkChallenges: [] = file.data.split(",");
        bulkChallenges.forEach(async (challenge: string, idx: number) => {
          let res = new DailyChallenge();
          res.result = challenge.trim();
          await save(repo, res, pMessage);
          if (idx === bulkChallenges.length) {
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
