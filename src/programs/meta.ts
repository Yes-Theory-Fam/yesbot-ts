import { Command, CommandHandler, DiscordEvent } from "../event-distribution";
import { Message, TextChannel } from "discord.js";
import bot from "../index";
import Tools from "../common/tools";

const metaEmojiName = "eeeh";

@Command({
  event: DiscordEvent.MESSAGE,
  trigger: "!meta",
  description: "penis",
})
class MetaCommand implements CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message): Promise<void> {
    const referencedMessageId = message.reference.messageID;
    const channelId = message.reference.channelID;
    const channel = bot.channels.resolve(channelId) as TextChannel;
    const referenceMessage = await channel.messages.fetch(referencedMessageId);

    if (referenceMessage.author === message.author) {
      Tools.handleUserError(message, "You cannot meta yourself!");
      return;
    }

    const emojiByName = (name: string) =>
      message.guild.emojis.cache.find((e) => e.name === name);
    const metaEmoji = emojiByName(metaEmojiName);

    const messageReactions = referenceMessage.reactions.cache.some(
      (reaction) => reaction.me
    );
    if (messageReactions) {
      Tools.handleUserError(
        message,
        "This command was already used on this user!"
      );
      return;
    }

    await referenceMessage.reply(``, {
      files: [
        "https://user-images.githubusercontent.com/17064122/122255708-ae6e9680-cece-11eb-8c01-6f29a3995680.png",
      ],
    });
    await referenceMessage.react(metaEmoji);
  }
}
