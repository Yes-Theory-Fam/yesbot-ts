import { Message, TextChannel } from "discord.js";
import Tools from "../../common/tools";
import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../event-distribution";
import { createYesBotLogger } from "../../log";
import prisma from "../../prisma";
import { revokeToggleChannelPermissions } from "./common";

const logger = createYesBotLogger("program", "channelToggleRemove");

@Command({
  event: DiscordEvent.MESSAGE,
  trigger: "!channelToggle",
  subTrigger: "remove",
  allowedRoles: ["Support"],
  description: "This",
})
class ChannelReactionRemove implements CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message): Promise<void> {
    const messageContent = message.content.split(" ");
    messageContent.shift();
    messageContent.shift();
    const [messageId, emoji, channelName] = messageContent;

    if (!messageId && !channelName) {
      await Tools.handleUserError(
        message,
        "Invalid syntax, please double check for messageId, emoji, channelName and try again."
      );
      return;
    }

    const reactionMessageObject = await prisma.message.findUnique({
      where: {
        id: messageId,
      },
    });

    const channelToggleObject = await prisma.channelToggle.findFirst({
      where: {
        messageId: messageId,
      },
    });

    if (!reactionMessageObject || !channelToggleObject) {
      await Tools.handleUserError(
        message,
        "I could not find the requested message, please double check for messageId try again."
      );
      return;
    }

    const guild = message.guild;
    const channel = guild.channels.cache.find(
      (channel) => channel.name === channelName.toLowerCase()
    ) as TextChannel;
    if (!channel) {
      await Tools.handleUserError(
        message,
        "I could not find the requested channel, please double check for channelName try again."
      );
      return;
    }

    const reactionMessage = await channel.messages.fetch(messageId);
    const toggledChannelId = channelToggleObject.channel;

    try {
      const reaction = reactionMessage.reactions.cache.find(
        (r) => r.emoji.toString() === emoji
      );
      const reactedUsers = reaction.users.cache;
      reactedUsers
        .filter((user) => !user.bot)
        .forEach(
          async (user) =>
            await revokeToggleChannelPermissions(user, toggledChannelId)
        );
      await reaction.remove();
      await prisma.channelToggle.delete({
        where: {
          id: channelToggleObject.id,
        },
      });
      await prisma.message.delete({
        where: {
          id: reactionMessageObject.id,
        },
      });
    } catch (err) {
      logger.error(
        "Error while removing all reactions from channelToggle message",
        err
      );
    }
    await message.reply("Succesfully removed channel toggle");
  }
}
