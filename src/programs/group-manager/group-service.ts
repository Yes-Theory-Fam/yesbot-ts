import { UserGroup } from "@prisma/client";
import { Snowflake, TextBasedChannel, userMention } from "discord.js";
import Tools from "../../common/tools";
import prisma from "../../prisma";

export enum GroupServiceErrors {
  RELATION_ALREADY_EXISTS = "RELATION_ALREADY_EXISTS",
  RELATION_NOT_FOUND = "RELATION_NOT_FOUND",
}

export class GroupService {
  private async getGroupMembership(groupId: number, userId: Snowflake) {
    return prisma.userGroupMembersGroupMember.findUnique({
      where: {
        userGroupId_groupMemberId: {
          userGroupId: groupId,
          groupMemberId: userId,
        },
      },
    });
  }

  public async getGroupById(id: number) {
    return prisma.userGroup.findUnique({ where: { id } });
  }

  public async getGroupByName(name: string) {
    return prisma.userGroup.findFirst({
      where: { name: { equals: name, mode: "insensitive" } },
    });
  }

  public async getGroupWithMembers(id: number) {
    return prisma.userGroup.findUnique({
      where: { id },
      include: { userGroupMembersGroupMembers: true },
    });
  }

  public async joinGroup(groupId: number, userId: Snowflake) {
    const exists = await this.getGroupMembership(groupId, userId);
    if (exists) throw new Error(GroupServiceErrors.RELATION_ALREADY_EXISTS);

    await prisma.userGroupMembersGroupMember.create({
      data: {
        userGroup: { connect: { id: groupId } },
        groupMember: {
          connectOrCreate: {
            where: { id: userId },
            create: { id: userId },
          },
        },
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

  async pingGroup(group: UserGroup, channel: TextBasedChannel) {
    const memberships = await prisma.userGroupMembersGroupMember.findMany({
      where: { userGroupId: group.id },
      select: { groupMemberId: true },
    });

    const userMentions = memberships
      .map((m) => m.groupMemberId)
      .map(userMention);

    const message = `**@${group.name}**: ${userMentions.join(", ")}`;
    const splits = Tools.splitMessage(message, { char: "," });

    for (const split of splits) await channel.send(split);

    await prisma.userGroup.update({
      data: { lastUsed: new Date() },
      where: { id: group.id },
    });
  }
}
