import { GuildMember, PartialGuildMember } from "discord.js";
import prisma from "../prisma";
import moderator from "../common/moderator";

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
    await moderator.textLog(
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
    await moderator.textLog(
      `(MemberLeave) There was an error removing member from the group DB: ${memberId}`
    );
  }
};
