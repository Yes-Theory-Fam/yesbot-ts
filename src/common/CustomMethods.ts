import { Message } from "discord.js";

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

export const replyWithEmoji = (message: Message, emoji: string) => {
  message.channel.send(emoji);
};
