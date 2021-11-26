import { GuildMember } from "discord.js";
import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../../event-distribution";
import prisma from "../../../prisma";

@Command({
  event: DiscordEvent.GUILD_MEMBER_UPDATE,
  roleNamesAdded: ["Break"],
})
class BreakAdded implements CommandHandler<DiscordEvent.GUILD_MEMBER_UPDATE> {
  async handle(member: GuildMember): Promise<void> {
    await prisma.usersOnBreak.create({ data: { userId: member.id } });
  }
}

@Command({
  event: DiscordEvent.GUILD_MEMBER_UPDATE,
  roleNamesRemoved: ["Break"],
})
class BreakRemove implements CommandHandler<DiscordEvent.GUILD_MEMBER_UPDATE> {
  async handle(member: GuildMember): Promise<void> {
    await prisma.usersOnBreak.delete({ where: { userId: member.id } });
  }
}
