import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
} from "discord.js";
import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../../event-distribution/index.js";
import { BuddyProjectService } from "../services/buddy-project.service.js";

@Command({
  event: DiscordEvent.SLASH_COMMAND,
  description: "Allows enabling and disabling matching of the Buddy Project",
  root: "buddy-project-mod",
  subCommand: "set-enabled",
  options: [
    {
      type: ApplicationCommandOptionType.Boolean,
      name: "enabled",
      description: "Whether matching should be enabled or not",
      required: true,
    },
  ],
})
class SetMatchingEnabled extends CommandHandler<DiscordEvent.SLASH_COMMAND> {
  async handle(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply({ ephemeral: true });

    const enabled = interaction.options.getBoolean("enabled") ?? false;

    const service = new BuddyProjectService();
    await service.setMatchingEnabled(enabled);

    await interaction.editReply("Done ✅");
  }
}
