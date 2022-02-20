import { GuildEmoji, Message, TextChannel } from "discord.js";
import bot from "../..";
import Tools from "../../common/tools";
import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../event-distribution";
import { logger } from "./add-reaction";

@Command({
  event: DiscordEvent.MESSAGE,
  trigger: "!message",
  subTrigger: "edit",
  allowedRoles: ["Support"],
  description: "This command lets you edit messages send by Yesbot",
})
class EditMessage implements CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message): Promise<void> {
    const [, , channelId, messageId] = message.content.split(" ");

    if (!channelId || !messageId) {
      await Tools.handleUserError(
        message,
        "Missing channelId or messageId. Syntax: `!message edit channelId messageId"
      );
      return;
    }

    const channel = bot.channels.resolve(channelId) as TextChannel;
    const messageToEdit = await channel.messages.fetch(messageId);

    if (!channel || !messageToEdit) {
      await Tools.handleUserError(
        message,
        "I could not find that channel or message! Please verify the arguments given"
      );
      return;
    }

    const emoji =
      message.guild.emojis.cache.find((emoji) => emoji.name === "yesbot") ??
      "🦥";
    const requestMessage = await message.channel.send({
      content: `Okay, now all you need to do is copy the original message and edit it and send it here and I will take care of the rest! ${emoji}`,
    });

    try {
      const editMessage = await message.channel.awaitMessages({
        filter: (m) => !m.author.bot && m.author == message.author,
        time: 60000,
        max: 1,
      });

      const requestedEdit = editMessage.first().content;
      await messageToEdit.edit(requestedEdit);
      await editMessage.first().delete();
      await requestMessage.delete();
      await message.react("👍");
    } catch (err) {
      logger.error("Failed to edit yesbot message", err);
      await message.react("👎");
    }
  }
}
