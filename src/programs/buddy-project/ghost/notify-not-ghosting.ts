import {
  Command,
  CommandHandler,
  DiscordEvent,
  EventLocation,
} from "../../../event-distribution";
import { ButtonInteraction, Client, Snowflake } from "discord.js";
import { BuddyProjectService } from "../services/buddy-project.service";
import { ghostWarningMessageRegex } from "./constants";

export const buddyProjectNotifyNotGhostingButtonId =
  "buddy-project-not-ghosting";

@Command({
  event: DiscordEvent.BUTTON_CLICKED,
  contentRegex: ghostWarningMessageRegex,
  location: EventLocation.DIRECT_MESSAGE,
  customId: buddyProjectNotifyNotGhostingButtonId,
})
class NotifyNotGhosting extends CommandHandler<DiscordEvent.BUTTON_CLICKED> {
  async handle(interaction: ButtonInteraction): Promise<void> {
    const { user, client } = interaction;

    const bpService = new BuddyProjectService();
    const entry = await bpService.getBuddy(user.id);

    await bpService.markAsNotGhosting(user.id);

    const ghostedId = entry.buddy?.userId;
    if (!ghostedId) {
      throw new Error("Cannot mark as not ghosting; entry does not have buddy");
    }

    await this.notifyBuddy(ghostedId, client);
    await this.notifyGhoster(interaction);
  }

  async notifyBuddy(buddyId: Snowflake, client: Client) {
    const guild = client.guilds.resolve(process.env.GUILD_ID);
    const buddyMember = guild?.members.resolve(buddyId);
    if (!buddyMember) {
      throw new Error(
        `Could not notify buddy: guild defined: ${!!guild}, buddyMember defined: ${!!buddyMember}`
      );
    }

    const buddyDm = await buddyMember.createDM();
    await buddyDm.send(
      "Hey there! Your buddy just reacted to my message, so hopefully they will reach out to you soon."
    );
  }

  async notifyGhoster(interaction: ButtonInteraction) {
    await interaction.update({
      content:
        "Glad to see you are still with us! Now don't forget to message your buddy ;)",
      components: [],
    });
  }
}
