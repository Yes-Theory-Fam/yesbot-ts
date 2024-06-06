import { UserGroup, UserGroupMembersGroupMember } from "@prisma/client";
import { APIInteractionGuildMember, TextBasedChannel } from "discord.js";
import { createYesBotLogger } from "../../log.js";
import prisma from "../../prisma.js";

export const logger = createYesBotLogger("program", "GroupManager");

export type GroupWithMemberRelationList = UserGroup & {
  userGroupMembersGroupMembers: UserGroupMembersGroupMember[];
};

export const timeRemainingForDeadchat = async (
  channel: TextBasedChannel,
  group: UserGroup
) => {
  const lastTwoMessages = (await channel.messages.fetch({ limit: 1 })).values();
  const lastMessages = [...lastTwoMessages];

  if (lastMessages.length < 1) {
    return 0;
  }

  const timeDifference =
    (Date.now() - lastMessages[0].createdTimestamp) / 1000 / 60;

  return group.deadtime - Math.round(timeDifference);
};

export const getRequestedGroup = async (requestedGroupName: string) => {
  return await prisma.userGroup.findFirst({
    where: {
      name: {
        equals: requestedGroupName,
        mode: "insensitive",
      },
    },
  });
};

export const findManyRequestedGroups = async (requestedGroupName: string) => {
  return prisma.userGroup.findMany({
    where: {
      name: {
        contains: requestedGroupName,
        mode: "insensitive",
      },
    },
    include: { userGroupMembersGroupMembers: true },
  });
};
