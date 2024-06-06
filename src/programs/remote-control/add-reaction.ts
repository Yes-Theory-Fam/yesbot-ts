import {
  ApplicationCommandOptionType,
  ChannelType,
  ChatInputCommandInteraction,
  TextChannel,
} from "discord.js";
import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../event-distribution/index.js";
import { createYesBotLogger } from "../../log.js";

export const logger = createYesBotLogger("programs", "remote-control");

enum Errors {
  MESSAGE_NOT_FOUND = "MESSAGE_NOT_FOUND",
}

@Command({
  event: DiscordEvent.SLASH_COMMAND,
  root: "remote",
  subCommand: "add-reaction",
  description: "Make me react to any message",
  options: [
    {
      name: "emoji",
      type: ApplicationCommandOptionType.String,
      description: "The emoji to react with",
      required: true,
    },
    {
      name: "channel",
      type: ApplicationCommandOptionType.Channel,
      channel_types: [ChannelType.GuildText],
      description: "The channel I can find the message in",
      required: true,
    },
    {
      name: "message-id",
      type: ApplicationCommandOptionType.String,
      description: "The ID of the image you want to me to react to",
      required: true,
    },
  ],
  errors: {
    [Errors.MESSAGE_NOT_FOUND]:
      "I could not find that message. Are you sure the ID is correct?",
  },
})
class AddReactions implements CommandHandler<DiscordEvent.SLASH_COMMAND> {
  async handle(interaction: ChatInputCommandInteraction): Promise<void> {
    const emoji = interaction.options.getString("emoji")!;
    const channel = interaction.options.getChannel("channel")! as TextChannel;
    const messageId = interaction.options.getString("message-id")!;

    const messageRequested = await channel.messages.fetch(messageId);

    if (!messageRequested) {
      throw new Error(Errors.MESSAGE_NOT_FOUND);
    }

    try {
      await messageRequested.react(emoji);
      await interaction.reply({ ephemeral: true, content: "Done!" });
    } catch (err) {
      logger.error("Failed to add reaction to message", err);
      await interaction.reply({
        ephemeral: true,
        content: "Failed to add the reaction.",
      });
    }
  }
}
