import {
  GroupMember,
  UserGroup,
  UserGroupMembersGroupMember,
} from "@yes-theory-fam/database/client";
import { GuildMember, Message } from "discord.js";
import {
  GroupInteractionSuccess,
  GroupInteractionError,
} from "../../common/interfaces";
import Tools from "../../common/tools";
import { createYesBotLogger } from "../../log";
import prisma from "../../prisma";

export const logger = createYesBotLogger("program", "GroupManager");

export type GroupInteractionInformation =
  | GroupInteractionSuccess
  | GroupInteractionError;

export type GroupWithMemberRelationList = UserGroup & {
  userGroupMembersGroupMembers: UserGroupMembersGroupMember[];
};

export type GroupWithMemberList = UserGroup & {
  userGroupMembersGroupMembers: (UserGroupMembersGroupMember & {
    groupMember: GroupMember;
  })[];
};

export const groupInteractionAndReport = async (
  message: Message,
  requestedGroupNames: string[],
  member: GuildMember,
  interaction: (
    groups: GroupWithMemberList[],
    member: GuildMember
  ) => Promise<GroupInteractionInformation[]>
) => {
  if (requestedGroupNames.filter((name) => name).length === 0) {
    await Tools.handleUserError(
      message,
      "I need at least one group name to do that!"
    );
    return;
  }

  const sanitizedGroupNames = requestedGroupNames
    .map((name) => name.replace(/,/g, "").trim())
    .filter((name) => name);

  const uniqueGroupNames = sanitizedGroupNames.filter(
    (name, index) => sanitizedGroupNames.indexOf(name) === index
  );

  const groups = await prisma.userGroup.findMany({
    where: {
      name: {
        in: uniqueGroupNames,
        mode: "insensitive",
      },
    },
    include: {
      userGroupMembersGroupMembers: {
        include: {
          groupMember: true,
        },
      },
    },
  });

  if (!groups || groups.length === 0) {
    await message.reply("I couldn't find any of the requested groups.");
    return;
  }

  const tryResult = await interaction(groups, member);
  if (uniqueGroupNames.length === 1) {
    // If the uniqueGroupNames only contain one element, the tryResult will be exactly one item long
    const result = tryResult[0];

    if (isSuccess(result)) {
      await message.react("👍");
    } else {
      await message.react("👎");
      await message.reply(result.message);
    }

    return;
  }

  const report: string[] = [];
  for (let i = 0; i < uniqueGroupNames.length; i++) {
    const name = uniqueGroupNames[i];
    const result = tryResult.filter(
      (result) => result.groupName.toLowerCase() === name.toLowerCase()
    )[0];
    if (!result) report.push(`${name} - 👎 - I could not find that group.`);
    else if (isSuccess(result)) report.push(`${name} - 👍`);
    else report.push(`${name} - 👎 - ${result.message}`);
  }

  await message.reply("\n" + report.join("\n"));
};

const isSuccess = (
  result: GroupInteractionInformation
): result is GroupInteractionSuccess => result.success;

export const tryJoinGroups = async (
  groups: GroupWithMemberList[],
  member: GuildMember
): Promise<GroupInteractionInformation[]> => {
  const results: GroupInteractionInformation[] = [];

  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];

    if (
      group.userGroupMembersGroupMembers.some(
        (m) => m.groupMemberId === member.id
      )
    ) {
      results.push({
        groupName: group.name,
        success: false,
        message: "You are already in that group!",
      });
      continue;
    }

    await prisma.userGroup.update({
      where: { id: group.id },
      data: {
        userGroupMembersGroupMembers: {
          create: {
            groupMember: {
              connectOrCreate: {
                where: { id: member.id },
                create: { id: member.id },
              },
            },
          },
        },
      },
    });

    results.push({
      groupName: group.name,
      success: true,
    });
  }

  return results;
};

export const tryLeaveGroups = async (
  groups: GroupWithMemberList[],
  member: GuildMember
): Promise<GroupInteractionInformation[]> => {
  const results: GroupInteractionInformation[] = [];

  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];

    const updatedMemberList = group.userGroupMembersGroupMembers.filter(
      (m) => m.groupMemberId !== member.id
    );

    if (
      updatedMemberList.length === group.userGroupMembersGroupMembers.length
    ) {
      results.push({
        success: false,
        groupName: group.name,
        message: "You are not in that group!",
      });
      continue;
    }

    await prisma.userGroupMembersGroupMember.delete({
      where: {
        userGroupId_groupMemberId: {
          groupMemberId: member.id,
          userGroupId: group.id,
        },
      },
    });

    results.push({
      groupName: group.name,
      success: true,
    });
  }

  return results;
};
