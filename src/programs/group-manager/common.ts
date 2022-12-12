import { UserGroup, UserGroupMembersGroupMember } from "@prisma/client";
import { APIInteractionGuildMember, Message } from "discord.js";
import { createYesBotLogger } from "../../log";
import prisma from "../../prisma";

export const logger = createYesBotLogger("program", "GroupManager");

export type GroupWithMemberRelationList = UserGroup & {
  userGroupMembersGroupMembers: UserGroupMembersGroupMember[];
};

export const timeRemainingForDeadchat = async (
  message: Message,
  group: UserGroup
) => {
  const lastTwoMessages = (
    await message.channel.messages.fetch({ limit: 2 })
  ).values();
  const lastMessages = [...lastTwoMessages];

  if (lastMessages.length < 2) {
    return 0;
  }

  const timeDifference =
    (Date.now() - lastMessages[1].createdTimestamp) / 1000 / 60;

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
