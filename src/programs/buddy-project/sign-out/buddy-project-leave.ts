import { GuildMember } from "discord.js";
import { BuddyProjectStatus } from "../../../__generated__/types.js";
import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../../event-distribution/index.js";
import { BuddyProjectService } from "../services/buddy-project.service.js";
import Tools from "../../../common/tools.js";

@Command({
  event: DiscordEvent.MEMBER_LEAVE,
})
class BuddyProjectLeave extends CommandHandler<DiscordEvent.MEMBER_LEAVE> {
  async handle(member: GuildMember): Promise<void> {
    const isBpEnabled = await Tools.isCommandEnabled(
      "buddy-project",
      member.guild
    );
    if (!isBpEnabled) return;

    const buddyProjectService = new BuddyProjectService();
    const status = await buddyProjectService.getBuddy(member.id);

    if (status.status === BuddyProjectStatus.SignedUp) {
      await buddyProjectService.signOut(member.id);
    }
  }
}
