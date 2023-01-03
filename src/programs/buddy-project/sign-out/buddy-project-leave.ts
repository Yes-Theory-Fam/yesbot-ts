import { GuildMember } from "discord.js";
import { BuddyProjectStatus } from "../../../__generated__/types";
import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../../event-distribution";
import { BuddyProjectService } from "../services/buddy-project.service";

@Command({
  event: DiscordEvent.MEMBER_LEAVE,
})
class BuddyProjectLeave extends CommandHandler<DiscordEvent.MEMBER_LEAVE> {
  async handle(member: GuildMember): Promise<void> {
    const buddyProjectService = new BuddyProjectService();
    const status = await buddyProjectService.getBuddy(member.id);

    if (status.status === BuddyProjectStatus.SignedUp) {
      await buddyProjectService.signOut(member.id);
    }
  }
}
