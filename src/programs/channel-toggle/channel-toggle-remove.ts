import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  TextChannel,
} from "discord.js";
import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../event-distribution";
import { createYesBotLogger } from "../../log";
import prisma from "../../prisma";
import { revokeToggleChannelPermissions } from "./common";

const logger = createYesBotLogger("program", "channelToggleRemove");

enum Errors {
  MESSAGE_NOT_FOUND = "MESSAGE_NOT_FOUND",
  TOGGLE_NOT_FOUND = "TOGGLE_NOT_FOUND",
}

@Command({
  event: DiscordEvent.SLASH_COMMAND,
  root: "channel-toggle",
  subCommand: "remove",
  description: "Remove an existing channel toggle guarding a channel",
  options: [
    {
      name: "message-id",
      type: ApplicationCommandOptionType.String,
      description: "ID of the message the toggle shall be removed from",
      required: true,
    },
    {
      name: "emoji",
      type: ApplicationCommandOptionType.String,
      description: "Emoji of the toggle that shall be removed",
      required: true,
    },
  ],
  errors: {
    [Errors.MESSAGE_NOT_FOUND]:
      "I could not find the requested message. Are you sure the ID is correct?",
    [Errors.TOGGLE_NOT_FOUND]:
      "I could not find the requested toggle. Are you sure the emoji is correct?",
  },
})
class ChannelReactionRemove
  implements CommandHandler<DiscordEvent.SLASH_COMMAND>
{
  async handle(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply();

    const messageId = interaction.options.getString("message-id")!;
    const emoji = interaction.options.getString("emoji")!;

    const reactionMessageObject = await prisma.message.findUnique({
      where: {
        id: messageId,
      },
    });

    if (!reactionMessageObject) throw new Error(Errors.MESSAGE_NOT_FOUND);

    const channelToggleObject = await prisma.channelToggle.findFirst({
      where: {
        messageId: messageId,
        emoji,
      },
    });

    if (!channelToggleObject) throw new Error(Errors.TOGGLE_NOT_FOUND);

    const guild = interaction.guild;
    const toggledMessageChannelId = reactionMessageObject.channel ?? "";
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
        .forEach((user) =>
          revokeToggleChannelPermissions(user, toggledChannelId)
        );

      await reaction?.remove();
    } catch (err) {
      logger.error(
        "Error while removing all reactions from channelToggle message",
        err
      );
      await interaction.editReply(
        "Failed to remove the toggle. Bully some developer for this!"
      );
      return;
    }

    await interaction.editReply(
      "Successfully removed channel toggle and reactions."
    );
  }
}
