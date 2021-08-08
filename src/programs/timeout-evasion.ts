import { Command, CommandHandler, DiscordEvent } from "../event-distribution";
import { GuildMember, PartialGuildMember } from "discord.js";
import bot from "../index";
import {
  gainedRole,
  isUserTimedOut,
  lostRole,
  textLog,
} from "../common/moderator";
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
    if (lostRole(oldMember, newMember, "Time Out")) {
      try {
        console.log("Test2");
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
      gainedRole(oldMember, newMember, "Time Out") &&
      !(await isUserTimedOut(newMember))
    ) {
      try {
        console.log("Test1");
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
    console.log("Test3");
    if (!(await isUserTimedOut(member))) return;
    console.log("Test4");
    await textLog(`<@${member.id}>, left the server when he was timed out!`);
  }
}

@Command({
  event: DiscordEvent.MEMBER_JOIN,
  description: "This handle checks if the user joined was timed out",
})
class ReportUserOnJoin implements CommandHandler<DiscordEvent.MEMBER_JOIN> {
  async handle(member: GuildMember): Promise<void> {
    console.log("Test5");
    if (!(await isUserTimedOut(member))) return;
    console.log("Test6");
    const guild = bot.guilds.resolve(process.env.GUILD_ID);
    const timeoutRole = Tools.getRoleByName("Time Out", guild);
    await member.roles.add(timeoutRole);
  }
}
