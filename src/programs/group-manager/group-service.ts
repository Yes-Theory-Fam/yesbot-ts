import { Snowflake } from "discord.js";
import prisma from "../../prisma";

export enum GroupServiceErrors {
  RELATION_ALREADY_EXISTS = "RELATION_ALREADY_EXISTS",
  RELATION_NOT_FOUND = "RELATION_NOT_FOUND",
}

export class GroupService {
  private async getGroupMembership(groupId: number, userId: Snowflake) {
    return await prisma.userGroupMembersGroupMember.findUnique({
      rejectOnNotFound: false,
      where: {
        userGroupId_groupMemberId: {
          userGroupId: groupId,
          groupMemberId: userId,
        },
      },
    });
  }

  public async getGroupById(id: number) {
    return await prisma.userGroup.findUnique({ where: { id } });
  }

  public async getGroupWithMembers(id: number) {
    return await prisma.userGroup.findUnique({
      where: { id },
      include: { userGroupMembersGroupMembers: true },
    });
  }

  public async joinGroup(groupId: number, userId: Snowflake) {
    const exists = await this.getGroupMembership(groupId, userId);
    if (exists) throw new Error(GroupServiceErrors.RELATION_ALREADY_EXISTS);

    await prisma.userGroupMembersGroupMember.create({
      data: {
        userGroupId: groupId,
        groupMemberId: userId,
      },
    });
  }

  async leaveGroup(groupId: number, userId: Snowflake) {
    const exists = await this.getGroupMembership(groupId, userId);
    if (!exists) throw new Error(GroupServiceErrors.RELATION_NOT_FOUND);

    await prisma.userGroupMembersGroupMember.delete({
      where: {
        userGroupId_groupMemberId: {
          userGroupId: groupId,
          groupMemberId: userId,
        },
      },
    });
  }
}
