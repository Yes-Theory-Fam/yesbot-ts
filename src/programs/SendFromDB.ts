import Discord, { Client, Message, TextChannel } from "discord.js";
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
      repo.save(res);
      messageChannel.send(embed);
    }
  }
};

export const saveToDb = async (tableName: string, info: string) => {
  let repo = undefined;
  if (tableName === "daily-challenge") {
    repo = await DailyChallengeRepository();
    let res = new DailyChallenge();
    res.result = info;
    repo.create(res);
  }
};
