import {
  Command,
  DiscordEvent,
  CommandHandler,
} from "../../../../event-distribution/index.js";
import { ChatInputCommandInteraction } from "discord.js";
import { buddyProjectInfoSetup } from "./buddy-project-info-setup.js";
import { buddyProjectDmsBlockedSetup } from "./dms-blocked-setup.js";
import { buddyProjectGhostSetup } from "./ghost-setup.js";
import { createBuddyProjectChannels } from "./create-buddy-project-channels.js";
import { createBuddyProjectRole } from "./create-buddy-project-role.js";

@Command({
  event: DiscordEvent.SLASH_COMMAND,
  root: "buddy-project-mod",
  subCommand: "bootstrap",
  description: "Sets up messages and interactions for the buddy project",
})
class BuddyProjectBootstrap extends CommandHandler<DiscordEvent.SLASH_COMMAND> {
  async handle(interaction: ChatInputCommandInteraction): Promise<void> {
    const { guild } = interaction;

    if (!guild) return;

    await interaction.deferReply({ ephemeral: true });

    const createdChannels = await createBuddyProjectChannels(guild);
    await interaction.editReply(
      `Ensured channels ${createdChannels.join(", ")} exist`
    );

    const createdRole = await createBuddyProjectRole(guild);
    await interaction.followUp({
      ephemeral: true,
      content: `Ensured role ${createdRole} exists`,
    });

    try {
      await buddyProjectInfoSetup(guild);
      await buddyProjectGhostSetup(guild);
      await buddyProjectDmsBlockedSetup(guild);

      await interaction.followUp({
        content: "Completed bootstrapping the Buddy Project!",
        ephemeral: true,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : e + "";
      await interaction.followUp({
        content: `Failed to bootstrap the Buddy Project:\n\n${message}`,
        ephemeral: true,
      });
    }
  }
}
