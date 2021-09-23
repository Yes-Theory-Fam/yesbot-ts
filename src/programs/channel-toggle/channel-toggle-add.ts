import { Message } from "discord.js";
import Tools from "../../common/tools";
import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../event-distribution";
import { createYesBotLogger } from "../../log";
import prisma from "../../prisma";
import { backfillReactions, getOrCreateMessage } from "./common";

const logger = createYesBotLogger("program,", "channelToggleRemove");

@Command({
  event: DiscordEvent.MESSAGE,
  trigger: "!channelToggle",
  subTrigger: "add",
  allowedRoles: ["Support"],
  description: "This handler is to add a channel toggle reaction",
})
class ChannelReactionAdd implements CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message): Promise<void> {
    const messageContent = message.content.split(" ");
    const [, , messageId, emoji, channelName] = messageContent;

    if (!messageId && emoji && channelName) {
      await Tools.handleUserError(
        message,
        "Invalid syntax, please double check for messageId, emoji, channelName and try again."
      );
      return;
    }

    const existingChannel = message.guild.channels.cache.find(
      (c) => c.name === channelName.toLocaleLowerCase()
    );

    if (!existingChannel) {
      await Tools.handleUserError(message, "That channel doesn't exist here.");
      return;
    }

    const reactionMessage = await getOrCreateMessage(messageId);

    if (reactionMessage.channel === null) {
      await message.reply(
        "Since this is the first time I've heard of this message I need your help. " +
          `Can you put one ${emoji} emoji on the message for me please?\n` +
          "After you've done that, I'll make sure to put up all the emojis on it. :grin:\n" +
          "You can keep adding emojis here and add one on the original message when you're done, and I'll add them all!"
      );
    }

    try {
      await prisma.channelToggle.create({
        data: {
          emoji,
          message: {
            connectOrCreate: {
              where: { id: reactionMessage.id },
              create: reactionMessage,
            },
          },
          channel: existingChannel.id,
        },
      });
      await message.react("👍");
    } catch (err) {
      logger.error("Failed to create toggle", err);
      await message.react("👎");
      return;
    }

    if (reactionMessage.channel !== null) {
      await backfillReactions(
        reactionMessage.id,
        reactionMessage.channel,
        message.guild
      );
      logger.debug(
        `backfilling reactions for message ${messageId} in ${reactionMessage.channel}`
      );
    }
  }
}
