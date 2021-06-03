import { GuildMember, PartialGuildMember } from "discord.js";
import { textLog } from "../common/moderator";
import prisma from "../prisma";
import { createYesBotLogger } from "../log";

const logger = createYesBotLogger("events", "memberLeave");

const memberLeave = async (member: GuildMember | PartialGuildMember) => {
  await RemoveFromBirthdays(member.id);
  await RemoveFromGroups(member.id);
};

// See https://www.prisma.io/docs/reference/api-reference/error-reference#p2025
const recordNotFoundCode = "P2025";

const RemoveFromBirthdays = async (userId: string) => {
  try {
    await prisma.birthday.delete({ where: { userId } });
  } catch (e) {
    if (e.code !== recordNotFoundCode) {
      logger.error("Removing from birthday DB failed: ", e);
      await textLog(
        `(MemberLeave) -> There was an error removing member from Birthday DB: ${userId}`
      );
    }
  }
};

const RemoveFromGroups = async (memberId: string) => {
  try {
    await prisma.userGroupMembersGroupMember.deleteMany({
      where: { groupMemberId: memberId },
    });
    await prisma.groupMember.delete({ where: { id: memberId } });
  } catch (e) {
    if (e.code !== recordNotFoundCode) {
      logger.error("Removing from groups DB failed: ", e);
      await textLog(
        `(MemberLeave) There was an error removing member from the group DB: ${memberId}`
      );
    }
  }
};

export default memberLeave;
