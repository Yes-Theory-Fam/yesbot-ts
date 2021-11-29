import { GuildMember } from "discord.js";
import { textLog } from "../../../common/moderator";
import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../../event-distribution";
import prisma from "../../../prisma";
import { logger } from "../common";

@Command({
  event: DiscordEvent.GUILD_MEMBER_UPDATE,
  roleNamesAdded: ["Break"],
})
class BreakAdded implements CommandHandler<DiscordEvent.GUILD_MEMBER_UPDATE> {
  async handle(member: GuildMember): Promise<void> {
    try {
      await prisma.usersOnBreak.create({ data: { userId: member.id } });
    } catch (e) {
      logger.error("Failed to register user for Break role", e);
      await textLog(
        `I added the break role to <@${member.id}> but couldn't register him to the DB, please contact Michel or Adrian`
      );
    }
  }
}

@Command({
  event: DiscordEvent.GUILD_MEMBER_UPDATE,
  roleNamesRemoved: ["Break"],
})
class BreakRemove implements CommandHandler<DiscordEvent.GUILD_MEMBER_UPDATE> {
  async handle(member: GuildMember): Promise<void> {
    try {
      await prisma.usersOnBreak.delete({ where: { userId: member.id } });
    } catch (e) {
      logger.error("Failed to update Break DB", e);
      await textLog(
        `I removed <@${member.id}> break role, but I couldn't clean up the DB please contact Michel or Adrian.`
      );
    }
  }
}
