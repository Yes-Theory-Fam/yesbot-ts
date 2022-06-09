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
  description: "This handler is to remove a channel toggle reaction",
})
class ChannelReactionRemove implements CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message): Promise<void> {
    const messageContent = message.content.split(" ");
    const [, , messageId, emoji] = messageContent;

    if (!messageId || !emoji) {
      await Tools.handleUserError(
        message,
        "Invalid syntax, please double check for messageId and emoji and try again."
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
        "I could not find the requested message, please double check the messageId and try again."
      );
      return;
    }

    const guild = message.guild;
    const toggledMessageChannelId = reactionMessageObject.channel ?? '';
    const channel = guild?.channels.resolve(
      toggledMessageChannelId
    ) as TextChannel;
    const reactionMessage = await channel.messages.fetch(messageId);
    const toggledChannelId = channelToggleObject.channel;

    try {
      const reaction = reactionMessage.reactions.cache.find(
        (r) => r.emoji.toString() === emoji
      );

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

      const reactedUsers = reaction?.users.cache;
      reactedUsers
        ?.filter((user) => !user.bot)
        .forEach(
          (user) =>
            revokeToggleChannelPermissions(user, toggledChannelId)
        );

      await reaction?.remove();
    } catch (err) {
      logger.error(
        "Error while removing all reactions from channelToggle message",
        err
      );
      await message.react("👎");
      return;
    }
    await message.reply("Succesfully removed channel toggle and reactions.");
  }
}
