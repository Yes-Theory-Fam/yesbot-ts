import { Message } from "discord.js";
import { Command, CommandHandler, DiscordEvent } from "../event-distribution";

@Command({
  event: DiscordEvent.MESSAGE,
  description:
    "This handler is for custom messages that do not have a specific trigger.",
})
class CustomMessageMethods implements CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message): Promise<void> {
    const messageContent = message.content;

    if (messageContent.match(/^(yesbot).*(\?)$/gi)) randomReply(message);

    if (
      messageContent.match(
        /yesbot i love you|yesbot i love u|i love you yesbot/i
      )
    )
      sendLove(message);

    if (messageContent.match(/^(F)$/i)) await message.react("🇫");

    if (messageContent.match(/(abooz|mod abuse)/i)) await message.react("👀");
  }
}

const randomReply = (message: Message) => {
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

const sendLove = (message: Message) => {
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
