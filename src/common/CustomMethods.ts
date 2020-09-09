import { Message, User, MessageAttachment } from "discord.js";
import { Logger } from "./Logger";
import { textLog, getMember } from "./moderator";
import {
  AUSTRALIA_IMAGE_URL,
  CANADA_IMAGE_URL,
  UK_IMAGE_URL,
  USA_IMAGE_URL,
} from "../const";
import Tools from "./tools";

export const sendLove = (message: Message) => {
  const loveArr = [
    "I love you too, Cutiepie",
    "I will find you and I will love you.",
    "Lets make some robot-human babies :smirk: ",
    "Hey you little gorgeous human, come change my oil.",
    "I appreciate you.",
    "Thank you, next!",
    "Okay.",
    "I think I have a crush on you.",
    "Tell me more :sweat_drops:",
    "You are amazing too! :) ",
    "I like you. Lets go out. But wait, let me ask my parents for permission first.",
    "I love you too! (Although I'm not entirely sure what love is but this experience I'm feeling is probably some iteration of love.)",
  ];
  const randomLoveReply = loveArr[Math.floor(Math.random() * loveArr.length)];
  message.reply(randomLoveReply);
  message.react("😍");
};

export const randomReply = (message: Message) => {
  let replies = [
    "yes.",
    "probably.",
    "doubtful.",
    "i'm afraid I don't know that one",
    "absolutely not.",
    "not a chance.",
    "definitely.",
    "very very very unlikely",
  ];
  message.reply(`${replies[Math.floor(Math.random() * replies.length)]}`);
};

export const reactWithEmoji = (message: Message, emoji: string) => {
  message.react(emoji);
};

export const proposeNameChange = async (name: string, botMessage: Message) => {
  Logger(
    "CustomMethods",
    "proposeNameChange",
    "Name change request sent to mods"
  );
  botMessage.reply(
    "Perfect! I've sent your name request to the mods, hopefully they answer soon! In the meantime, you're free to roam around the server and explore. Maybe post an introduction to get started? :grin:"
  );
  const message = `Username: ${botMessage.author.toString()} would like to rename to "${name}". Allow?`;
  try {
    const sentMessage = await textLog(message);
    sentMessage.react("✅").then(() => sentMessage.react("🚫"));
    sentMessage
      .awaitReactions(
        (reaction: any, user: User) => {
          return !user.bot;
        },
        { max: 1, time: 6000000, errors: ["time"] }
      )
      .then((collected) => {
        const reaction = collected.first();
        switch (reaction.emoji.toString()) {
          case "✅":
            const member = getMember(botMessage.author.id);
            member.setNickname(name);
            sentMessage.delete();
            textLog(`${botMessage.author.toString()} was renamed to ${name}.`);
            break;
          case "🚫":
            sentMessage.delete();
            textLog(
              `${botMessage.author.toString()} was *not* renamed to ${name}.`
            );
            break;

          default:
            break;
        }
      });
  } catch (err) {
    Logger(
      "MessageManager",
      "proposeNameChange",
      `Error changing name: ${err}`
    );
  }
};

export const deleteMessages = async (botMessage: Message) => {
  try {
    const words = Tools.stringToWords(botMessage.content);
    words.shift();
    const messagesToDelete = Number(words[0]);
    if (messagesToDelete !== NaN) {
      botMessage.channel.bulkDelete(messagesToDelete);
    }
  } catch (err) {
    Logger("CustomMethods", "deleteMessages", err);
  }
};

export const addVote = async (botMessage: Message) => {
  try {
    const words = Tools.stringToWords(botMessage.content);
    words.shift();
    const messageId = words[0];
    const messageToVote = await botMessage.channel.messages.resolve(messageId);
    if (!messageToVote) botMessage.react("👎");
    else
      botMessage
        .delete()
        .then(() => messageToVote.react("👍"))
        .then(() => messageToVote.react("👎"));
  } catch (err) {
    Logger("CustomMethods", "addVote", err);
  }
};

export const SendMap = (country: string, botMessage: Message) => {
  botMessage.delete();
  const image = new MessageAttachment(
    country === "usa"
      ? USA_IMAGE_URL
      : country === "canada"
      ? CANADA_IMAGE_URL
      : country === "australia"
      ? AUSTRALIA_IMAGE_URL
      : UK_IMAGE_URL
  );
  botMessage.channel.send(image);
};
