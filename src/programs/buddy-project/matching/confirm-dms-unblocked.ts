import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../../event-distribution";
import { ChatNames } from "../../../collections/chat-names";
import { ButtonInteraction, ChannelType, Client, Snowflake } from "discord.js";
import { BuddyProjectService } from "../services/buddy-project.service";

export const buddyProjectConfirmsDmsUnblockedButtonId =
  "buddy-project-dms-unblocked";

@Command({
  event: DiscordEvent.BUTTON_CLICKED,
  customId: buddyProjectConfirmsDmsUnblockedButtonId,
  channelNames: [ChatNames.BUDDY_PROJECT_DMS_DISABLED],
})
class BuddyProjectConfirmDmsUnblocked extends CommandHandler<DiscordEvent.BUTTON_CLICKED> {
  async handle(interaction: ButtonInteraction): Promise<void> {
    const { client, user, guild, channelId } = interaction;
    if (!guild) return;

    await interaction.deferReply({ ephemeral: true });
    const channel = await guild!.channels.fetch(channelId);
    if (!channel || channel.type !== ChannelType.GuildText) return;

    const dmsWork = await this.ensureDmsWork(user.id, client);

    if (!dmsWork) {
      await this.rejectConfirmation(interaction);
      return;
    }

    await this.resetBlockedStatus(user.id);
    await channel.permissionOverwrites.delete(user.id);
    await interaction.editReply("Completed!");
  }

  async ensureDmsWork(userId: Snowflake, client: Client) {
    const user = await client.users.fetch(userId);
    try {
      const dm = await user.createDM();
      await dm.send(
        "Hey there!\n\nThis is just a quick test to see if your DMs are set up correctly now. All looks good, so you will be matched soon!"
      );
      return true;
    } catch (e) {
      // Again, assume that this is because of incorrect permissions
      return false;
    }
  }

  async rejectConfirmation(interaction: ButtonInteraction) {
    await interaction.editReply(
      "I tried sending you a DM and it failed so the settings don't seem to be just right. Please follow the guide above and click the button again when you are done!"
    );
  }

  async resetBlockedStatus(userId: Snowflake) {
    await new BuddyProjectService().unblock(userId);
  }
}
