import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
} from "discord.js";
import { BuddyProjectStatus } from "../../../__generated__/types";
import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../../event-distribution";
import { BuddyProjectStatusPayload } from "../services/buddy-project.generated";
import { BuddyProjectService } from "../services/buddy-project.service";

@Command({
  event: DiscordEvent.SLASH_COMMAND,
  root: "buddy-project-mod",
  subCommand: "find-buddy",
  description: "Look up someone's buddy",
  options: [
    {
      name: "user",
      description: "The user you want to find the buddy for",
      type: ApplicationCommandOptionType.User,
      required: true,
    },
  ],
})
class FindBuddyMod extends CommandHandler<DiscordEvent.SLASH_COMMAND> {
  async handle(interaction: ChatInputCommandInteraction): Promise<void> {
    const user = interaction.options.getUser("user")!;
    const buddyProjectService = new BuddyProjectService();

    const payload = await buddyProjectService.getBuddy(user.id);
    const message = this.getMessage(payload);

    await interaction.reply(message);
  }

  private getMessage(payload: BuddyProjectStatusPayload) {
    switch (payload.status) {
      case BuddyProjectStatus.NotSignedUp:
        return "That user is not signed up (yet).";
      case BuddyProjectStatus.SignedUp:
        return "That user does not have a buddy (yet).";
      case BuddyProjectStatus.Matched:
        return `That user's buddy is <@${payload.buddy?.userId}>.`;
    }
  }
}
