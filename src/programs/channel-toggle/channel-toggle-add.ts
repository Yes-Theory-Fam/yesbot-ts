import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
} from "discord.js";
import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../event-distribution";
import { createYesBotLogger } from "../../log";
import prisma from "../../prisma";
import { backfillReactions, getOrCreateMessage } from "./common";

const logger = createYesBotLogger("program", "channelToggleRemove");

@Command({
  event: DiscordEvent.SLASH_COMMAND,
  root: "channel-toggle",
  subCommand: "add",
  description: "Add a reaction to guard a channel from being accessed",
  options: [
    {
      name: "message-id",
      type: ApplicationCommandOptionType.String,
      description: "ID of the message to add the reaction to",
      required: true,
    },
    {
      name: "emoji",
      type: ApplicationCommandOptionType.String,
      description: "Emoji to use as the reaction",
      required: true,
    },
    {
      name: "channel",
      type: ApplicationCommandOptionType.Channel,
      description: "The channel in which to find the message",
      required: true,
    },
  ],
})
class ChannelReactionAdd implements CommandHandler<DiscordEvent.SLASH_COMMAND> {
  async handle(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply();

    const messageId = interaction.options.getString("message-id")!;
    const emoji = interaction.options.getString("emoji")!;
    const channel = interaction.options.getChannel("channel")!;

    const reactionMessage = await getOrCreateMessage(messageId);

    let needsReaction = false;

    if (reactionMessage.channel === null) {
      needsReaction = true;
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
          channel: channel.id,
        },
      });

      const backfillRequestText =
        "Since this is the first time I've heard of this message I need your help. " +
        `Can you put one ${emoji} emoji on the message for me please?\n` +
        "After you've done that, I'll make sure to put up all the emojis on it. 😁\n" +
        "You can keep adding emojis here and add one on the original message when you're done, and I'll add them all!";

      const reply = `Added channel toggle!${
        needsReaction ? "\n\n" + backfillRequestText : ""
      }`;

      await interaction.editReply(reply);
    } catch (err) {
      logger.error("Failed to create toggle", err);
      await interaction.editReply(
        "Failed to create toggle. Bully some developer for this!"
      );
      return;
    }

    if (reactionMessage.channel !== null && interaction.guild) {
      await backfillReactions(
        reactionMessage.id,
        reactionMessage.channel,
        interaction.guild
      );
      logger.debug(
        `Backfilling reactions for message ${messageId} in ${reactionMessage.channel}`
      );
    }
  }
}
