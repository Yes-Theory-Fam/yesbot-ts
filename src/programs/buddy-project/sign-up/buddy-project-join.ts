import { GuildMember } from "discord.js";
import { BuddyProjectStatus } from "../../../__generated__/types.js";
import Tools from "../../../common/tools.js";
import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../../event-distribution/index.js";
import { BuddyProjectService } from "../services/buddy-project.service.js";

@Command({
  event: DiscordEvent.MEMBER_JOIN,
})
class BuddyProjectJoin extends CommandHandler<DiscordEvent.MEMBER_JOIN> {
  async handle(member: GuildMember): Promise<void> {
    const isBpEnabled = await Tools.isCommandEnabled(
      "buddy-project",
      member.guild
    );
    if (!isBpEnabled) return;

    const buddyProjectService = new BuddyProjectService();
    const status = await buddyProjectService.getBuddy(member.id);

    if (status.status === BuddyProjectStatus.Matched) {
      const buddyProjectRoleName = `Buddy Project ${new Date().getFullYear()}`;
      const role = Tools.getRoleByName(buddyProjectRoleName, member.guild);

      if (role) await member.roles.add(role);
    }
  }
}
