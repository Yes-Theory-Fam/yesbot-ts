import { GuildMember, PartialGuildMember } from "discord.js";
import { textLog } from "../common/moderator";
import prisma from "../prisma";
import { createYesBotLogger } from "../log";

const logger = createYesBotLogger("events", "MemberLeave");

export class MemberLeave {
  constructor(member: GuildMember | PartialGuildMember) {
    RemoveFromBirthdays(member.id);
    RemoveFromGroups(member.id);
  }
}

const RemoveFromBirthdays = async (userId: string) => {
  try {
    await prisma.birthday.delete({ where: { userId } });
  } catch (e) {
    logger.error("Removing from birthday DB failed: ", e);
    await textLog(
      `(MemberLeave) -> There was an error removing member from Birthday DB: ${userId}`
    );
  }
};

const RemoveFromGroups = async (memberId: string) => {
  try {
    await prisma.userGroupMembersGroupMember.deleteMany({
      where: { groupMemberId: memberId },
    });
    await prisma.groupMember.delete({ where: { id: memberId } });
  } catch (e) {
    logger.error("Removing from groups DB failed: ", e);
    await textLog(
      `(MemberLeave) There was an error removing member from the group DB: ${memberId}`
    );
  }
};
