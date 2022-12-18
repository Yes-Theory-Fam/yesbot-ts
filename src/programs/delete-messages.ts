import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  TextChannel,
} from "discord.js";
import { Command, CommandHandler, DiscordEvent } from "../event-distribution";

@Command({
  event: DiscordEvent.SLASH_COMMAND,
  root: "delete",
  description: "Delete the last X messages in a channel",
  options: [
    {
      name: "amount",
      description: "The number of messages to delete",
      type: ApplicationCommandOptionType.Integer,
      max_value: 100,
      min_value: 1,
      required: true,
    },
  ],
})
class DeleteMessages implements CommandHandler<DiscordEvent.SLASH_COMMAND> {
  async handle(interaction: ChatInputCommandInteraction): Promise<void> {
    const amount = interaction.options.getInteger("amount")!;
    const channel = interaction.channel as TextChannel;

    await channel.bulkDelete(amount);
  }
}
