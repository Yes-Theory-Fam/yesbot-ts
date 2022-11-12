import {
  Command,
  DiscordEvent,
  CommandHandler,
} from "../../../event-distribution";
import { ChatInputCommandInteraction } from "discord.js";
import { buddyProjectInfoSetup } from "./buddy-project-info-setup";
import { buddyProjectDmsBlockedSetup } from "./dms-blocked-setup";
import { buddyProjectGhostSetup } from "./ghost-setup";

@Command({
  event: DiscordEvent.SLASH_COMMAND,
  root: "buddy-project",
  subCommand: "bootstrap",
  description: "Sets up messages and interactions for the buddy project",
})
class BuddyProjectSetup extends CommandHandler<DiscordEvent.SLASH_COMMAND> {
  async handle(interaction: ChatInputCommandInteraction): Promise<void> {
    const { guild } = interaction;

    if (!guild) return;

    await interaction.deferReply({ ephemeral: true });

    try {
      await buddyProjectInfoSetup(guild);
      await buddyProjectGhostSetup(guild);
      await buddyProjectDmsBlockedSetup(guild);

      await interaction.editReply("Completed bootstrapping the Buddy Project!");
    } catch (e) {
      const message = e instanceof Error ? e.message : e + "";
      await interaction.editReply(
        `Failed to bootstrap the Buddy Project:\n\n${message}`
      );
    }
  }
}
