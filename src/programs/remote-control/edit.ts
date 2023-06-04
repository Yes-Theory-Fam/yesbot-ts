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
} from "../../event-distribution";
import { logger } from "./add-reaction";

enum Errors {
  MESSAGE_NOT_FOUND = "MESSAGE_NOT_FOUND",
  NOT_YESBOT_MESSAGE = "NOT_YESBOT_MESSAGE",
}

@Command({
  event: DiscordEvent.SLASH_COMMAND,
  root: "remote",
  subCommand: "edit",
  description: "Edit one of my previous messages",
  options: [
    {
      name: "channel",
      channel_types: [ChannelType.GuildText],
      description: "The channel I can find the message in",
      type: ApplicationCommandOptionType.Channel,
      required: true,
    },
    {
      name: "message-id",
      description: "The ID of the message I shall edit",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: "content",
      description: "The new content of the message",
      type: ApplicationCommandOptionType.String,
      max_length: 2000,
      required: true,
    },
  ],
  errors: {
    [Errors.MESSAGE_NOT_FOUND]:
      "I could not find that message. Are you sure the ID is correct?",
  },
})
class EditMessage implements CommandHandler<DiscordEvent.SLASH_COMMAND> {
  async handle(interaction: ChatInputCommandInteraction): Promise<void> {
    const channel = interaction.options.getChannel("channel")! as TextChannel;
    const messageId = interaction.options.getString("message-id")!;
    const content = interaction.options.getString("content")!;

    const messageToEdit = await channel.messages.fetch(messageId);

    if (!messageToEdit) {
      throw new Error(Errors.MESSAGE_NOT_FOUND);
    }

    if (messageToEdit.author.id !== interaction.client.user.id) {
      throw new Error(Errors.NOT_YESBOT_MESSAGE);
    }

    await messageToEdit.edit(content);

    try {
      await interaction.reply({ ephemeral: true, content: "Done!" });
    } catch (err) {
      logger.error("Failed to edit yesbot message", err);
      await interaction.reply({
        ephemeral: true,
        content: "Failed to edit the message!",
      });
    }
  }
}
