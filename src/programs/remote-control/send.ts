import {
  ApplicationCommandOptionType,
  ChannelType,
  ChatInputCommandInteraction,
  TextChannel,
} from "discord.js";
import Tools from "../../common/tools";
import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../event-distribution";
import { logger } from "./add-reaction";

@Command({
  event: DiscordEvent.SLASH_COMMAND,
  root: "remote",
  subCommand: "send",
  description: "Make me send a message somewhere",
  options: [
    {
      name: "channel",
      type: ApplicationCommandOptionType.Channel,
      channel_types: [ChannelType.GuildText],
      description: "The channel I shall send the message in",
      required: true,
    },
    {
      name: "content",
      type: ApplicationCommandOptionType.String,
      description: "The content of the message to send",
      required: true,
    },
  ],
})
class SendMessage implements CommandHandler<DiscordEvent.SLASH_COMMAND> {
  async handle(interaction: ChatInputCommandInteraction): Promise<void> {
    const channel = interaction.options.getChannel("channel")! as TextChannel;
    const content = interaction.options.getString("content")!;

    try {
      const messagesBatches = Tools.splitMessage(content, { char: " " });
      for (const batch of messagesBatches) {
        await channel.send({ content: batch });
      }

      await interaction.reply({ ephemeral: true, content: "Done!" });
    } catch (err) {
      logger.error("Failed to send custom yesbot message", err);
      await interaction.reply({
        ephemeral: true,
        content:
          "I seem to had a little hiccup while sending custom messages please verify I didn't send anything by mistake :c",
      });
    }
  }
}
