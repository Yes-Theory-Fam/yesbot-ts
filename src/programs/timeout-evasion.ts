import { Command, CommandHandler, DiscordEvent } from "../event-distribution";
import { GuildMember, PartialGuildMember } from "discord.js";
import bot from "../index";
import { isUserTimedOut, textLog } from "../common/moderator";
import Tools from "../common/tools";
import prisma from "../prisma";

@Command({
  event: DiscordEvent.GUILD_MEMBER_UPDATE,
  description:
    "This handle checks if the user was given or removed the Time Out role",
})
class TimeoutRoleStatus
  implements CommandHandler<DiscordEvent.GUILD_MEMBER_UPDATE>
{
  async handle(
    oldMember: GuildMember | PartialGuildMember,
    newMember: GuildMember | PartialGuildMember
  ): Promise<void> {
    if (await Tools.lostRole(oldMember, newMember, "Time Out")) {
      try {
        await prisma.timedOutUsers.delete({
          where: {
            userId: newMember.id,
          },
        });
      } catch (e) {
        await textLog(
          `Failed to remove <@${newMember.id}> from timed out DB, please contact a @Developer`
        );
      }
    }
    if (
      (await Tools.gainedRole(oldMember, newMember, "Time Out")) &&
      !(await isUserTimedOut(newMember))
    ) {
      try {
        await prisma.timedOutUsers.create({
          data: {
            userId: newMember.id,
          },
        });
      } catch (e) {
        await textLog(
          `Failed to register <@${newMember.id}> to the DB, please contact a @Developer`
        );
      }
    }
  }
}

@Command({
  event: DiscordEvent.MEMBER_LEAVE,
  description: "This handle checks if the user left was timed out",
})
class ReportUserOnLeave implements CommandHandler<DiscordEvent.MEMBER_LEAVE> {
  async handle(member: GuildMember): Promise<void> {
    if (!(await isUserTimedOut(member))) return;
    await textLog(`<@${member.id}>, left the server when he was timed out!`);
  }
}

@Command({
  event: DiscordEvent.MEMBER_JOIN,
  description: "This handle checks if the user joined was timed out",
})
class ReportUserOnJoin implements CommandHandler<DiscordEvent.MEMBER_JOIN> {
  async handle(member: GuildMember): Promise<void> {
    if (!(await isUserTimedOut(member))) return;
    const guild = bot.guilds.resolve(process.env.GUILD_ID);
    const timeoutRole = Tools.getRoleByName("Time Out", guild);
    await member.roles.add(timeoutRole);
  }
}
