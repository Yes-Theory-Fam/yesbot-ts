import { Command, CommandHandler, DiscordEvent } from "../event-distribution";
import { GuildMember, PartialGuildMember } from "discord.js";
import bot from "../index";
import { textLog } from "../common/moderator";
import Tools from "../common/tools";
import prisma from "../prisma";
import { createYesBotLogger } from "../log";

const logger = createYesBotLogger("program", "timeout-evasion");

const isUserTimedOut = async (
  member: GuildMember | PartialGuildMember
): Promise<boolean> => {
  return !!(await prisma.timedOutUsers.findFirst({
    where: {
      userId: member.id,
    },
  }));
};

@Command({
  event: DiscordEvent.GUILD_MEMBER_UPDATE,
  roleNamesAdded: ["Time Out"],
  description:
    "This handler adds the user to the DB when he gains the time out role",
})
class TimeOutAdded implements CommandHandler<DiscordEvent.GUILD_MEMBER_UPDATE> {
  async handle(member: GuildMember): Promise<void> {
    if (await isUserTimedOut(member)) return;

    const engineerRole = Tools.getRoleByName(
      process.env.ENGINEER_ROLE_NAME,
      member.guild
    );
    try {
      await prisma.timedOutUsers.create({
        data: {
          userId: member.id,
        },
      });
    } catch (e) {
      logger.error("Failed to add user to the DB " + e);
      await textLog(
        `Failed to register <@${member.id}> to the DB, please contact a <@&${engineerRole.id}>`
      );
    }
  }
}

@Command({
  event: DiscordEvent.GUILD_MEMBER_UPDATE,
  roleNamesRemoved: ["Time Out"],
  description:
    "This handler removes the user to the DB when he loses the time out role",
})
class TimeOutRemoved
  implements CommandHandler<DiscordEvent.GUILD_MEMBER_UPDATE>
{
  async handle(member: GuildMember): Promise<void> {
    const engineerRole = Tools.getRoleByName(
      process.env.ENGINEER_ROLE_NAME,
      member.guild
    );
    try {
      await prisma.timedOutUsers.delete({
        where: {
          userId: member.id,
        },
      });
    } catch (e) {
      logger.error("Failed to remove user from the DB " + e);
      await textLog(
        `Failed to remove <@${member.id}> from timed out DB, please contact a <@&${engineerRole.id}>`
      );
    }
  }
}

@Command({
  event: DiscordEvent.MEMBER_LEAVE,
  description: "This handler checks if the user left was timed out",
})
class ReportUserOnLeave implements CommandHandler<DiscordEvent.MEMBER_LEAVE> {
  async handle(member: GuildMember): Promise<void> {
    if (!(await isUserTimedOut(member))) return;
    await textLog(`<@${member.id}>, left the server when he was timed out!`);
  }
}

@Command({
  event: DiscordEvent.MEMBER_JOIN,
  description: "This handler checks if the user joined was timed out",
})
class ReportUserOnJoin implements CommandHandler<DiscordEvent.MEMBER_JOIN> {
  async handle(member: GuildMember): Promise<void> {
    if (!(await isUserTimedOut(member))) return;
    const timeoutRole = Tools.getRoleByName("Time Out", member.guild);
    await member.roles.add(timeoutRole);
    await textLog(
      `<@${member.id}>, has rejoined and was assigned the timeout role for evading timeout`
    );
  }
}
