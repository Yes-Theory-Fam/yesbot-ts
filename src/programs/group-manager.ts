import {
  Channel,
  Guild,
  GuildMember,
  Message,
  MessageEmbed,
  MessageReaction,
  Snowflake,
  TextChannel,
  User,
} from "discord.js";
import Tools from "../common/tools";
import { isAuthorModerator } from "../common/moderator";
import {
  GroupMember,
  Message as MessageEntity,
  UserGroup,
  UserGroupMembersGroupMember,
} from "@yes-theory-fam/database/client";
import {
  GroupInteractionError,
  GroupInteractionSuccess,
} from "../common/interfaces";
import { createYesBotLogger } from "../log";
import { ChatNames } from "../collections/chat-names";
import prisma from "../prisma";

const logger = createYesBotLogger("program", "GroupManager");

type GroupInteractionInformation =
  | GroupInteractionSuccess
  | GroupInteractionError;

type GroupWithMemberRelationList = UserGroup & {
  userGroupMembersGroupMembers: UserGroupMembersGroupMember[];
};

type GroupWithMemberList = UserGroup & {
  userGroupMembersGroupMembers: (UserGroupMembersGroupMember & {
    groupMember: GroupMember;
  })[];
};

const isSuccess = (
  result: GroupInteractionInformation
): result is GroupInteractionSuccess => result.success;

const groupManager = async (message: Message, isConfig: boolean) => {
  const content = message.content;

  if (isConfig) {
    const words = Tools.stringToWords(content);
    words.shift();
    const [action, requestName, ...rest] = words;
    const description = rest.join(" ");

    if (
      !action ||
      ![
        "join",
        "create",
        "leave",
        "search",
        "delete",
        "update",
        "toggle",
        "changeCooldown",
        "changeDeadtime",
        "changeGroupPingSettings",
        ``,
      ].includes(action)
    ) {
      const helpMessage = `Incorrect syntax, please use the following: \`!group join|leave|create|search|delete|update|changeCooldown|changeDeadtime\`. If you need additional help, react with 🛠️ below to tag a ${process.env.ENGINEER_ROLE_NAME}`;
      await message.reply(helpMessage);
      return;
    }

    const user = message.member;
    const moderator = isAuthorModerator(message);

    switch (action) {
      case "join":
        await joinGroup(message, [requestName, ...rest], user);
        break;

      case "toggle":
        await toggleGroup(words, message);
        break;

      case "create":
        if (moderator)
          await createGroup(message, requestName, user, description);
        else
          await Tools.handleUserError(
            message,
            "You do not have permission to use this command."
          );
        break;

      case "leave":
        await leaveGroup(message, [requestName, ...rest], user);
        break;

      case "search":
        await searchGroup(message, requestName);
        break;

      case "delete":
        if (moderator) await deleteGroup(message, requestName);
        else
          await Tools.handleUserError(
            message,
            "You do not have permission to use this command."
          );
        break;

      case "update": {
        moderator
          ? await updateGroup(message, requestName, description)
          : await Tools.handleUserError(
              message,
              "You do not have permission to use this command."
            );
        break;
      }

      case "changeDeadtime": {
        moderator
          ? await changeDeadtime(message, requestName, description)
          : await Tools.handleUserError(
              message,
              "You do not have permissions to use this command."
            );
        break;
      }

      case "changeGroupPingSettings": {
        moderator
          ? await changeGroupPingSettings(message, requestName, description)
          : await Tools.handleUserError(
              message,
              "You do not have permissions to use this command."
            );
        break;
      }

      case "changeCooldown": {
        moderator
          ? await changeCooldown(message, requestName, description)
          : await Tools.handleUserError(
              message,
              "You do not have permission to use this command."
            );
      }
    }
  } else {
    if (!isChannelAllowed(message.channel)) {
      return;
    }
    const lines = content.split("\n");
    const unquoted = lines.filter((line) => !line.startsWith(">")).join("\n");
    const hasUnquotedGroupPing = unquoted.includes("@group");

    if (!hasUnquotedGroupPing) return;

    const groupTriggerStart = content.substring(content.indexOf("@group"));
    const args = <string[]>groupTriggerStart.split(/\s/g);

    args.shift();
    const [requestName] = args;

    if (!message.author.bot && !isGroupAllowed(requestName)) {
      await Tools.handleUserError(
        message,
        "That group is not pingable by members, sorry!"
      );
      return;
    }

    const groups = await prisma.userGroup.findMany({
      include: {
        userGroupMembersGroupMembers: { include: { groupMember: true } },
      },
    });
    const matchingGroups = groups.filter(
      (group: UserGroup) =>
        group.name.toLowerCase() == requestName.toLowerCase()
    );

    if (matchingGroups.length === 0) {
      await message.reply("I couldn't find that group.");
      return;
    }

    const group = matchingGroups[0];
    const timeDifference = (Date.now() - group.lastUsed.getTime()) / 1000 / 60;
    const deadChatTimeRemaining = await timeRemainingForDeadchat(
      message,
      group
    );

    const moderator = isAuthorModerator(message);
    const setting = group.groupPingOption;

    if (setting === "moderator" && !moderator) {
      await Tools.handleUserError(
        message,
        "Sorry! This group is only pingable by moderators."
      );
      return;
    }

    if (setting === "bot" && !message.author.bot) {
      await Tools.handleUserError(
        message,
        "Sorry! This group is only pingable by YesBot."
      );
      return;
    }

    if (setting === "off") {
      await Tools.handleUserError(
        message,
        "Sorry! This group is not pingable by members."
      );
      return;
    }

    if (deadChatTimeRemaining > 0) {
      await Tools.handleUserError(
        message,
        `Chat is not dead! You can ping this group if there have been no messages in the next ${deadChatTimeRemaining} minutes.`
      );
      return;
    }

    if (timeDifference < group.cooldown) {
      const remainingCooldown = group.cooldown - Math.round(timeDifference);
      await Tools.handleUserError(
        message,
        `Sorry, this group was already pinged within the last ${group.cooldown} minutes; it's about ${remainingCooldown} minutes left until you can ping it again.`
      );
      return;
    }

    const groupPingMessage =
      `**@${group.name}**: ` +
      group.userGroupMembersGroupMembers
        .map((member) => `<@${member.groupMemberId}>`)
        .join(", ");

    await message.channel.send(groupPingMessage, { split: { char: "," } });

    await prisma.userGroup.update({
      where: { id: group.id },
      data: { lastUsed: new Date() },
    });
  }
};

const getOrCreateMessage = async (
  messageId: Snowflake
): Promise<MessageEntity> => {
  const existingMessage = await prisma.message.findUnique({
    where: { id: messageId },
  });
  if (existingMessage) return existingMessage;
  return await prisma.message.create({ data: { id: messageId } });
};

const toggleGroup = async (words: string[], message: Message) => {
  if (!isAuthorModerator(message)) {
    await message.react("👎");
    return;
  }

  words.shift();
  const [messageId, emoji, channelName] = words;
  if (!(messageId && emoji && channelName)) {
    await message.react("👎");
    await message.reply(
      "Invalid syntax, please double check for messageId, emoji, channelName and try again."
    );
    return;
  }
  const existingChannel = message.guild.channels.cache.find(
    (c) => c.name === channelName.toLowerCase()
  );
  if (!existingChannel) {
    await message.react("👎");
    await message.reply("That channel doesn't exist here.");
    return;
  }

  const reactionMessage = await getOrCreateMessage(messageId);

  if (reactionMessage.channel === null) {
    await message.reply(
      "Since this is the first time I've heard of this message I need your help. " +
        `Can you put one ${emoji} emoji on the message for me please?\n` +
        "After you've done that, I'll make sure to put up all the emojis on it. :grin:\n" +
        "You can keep adding emojis here and add one on the original message when you're done, and I'll add them all!"
    );
  }

  try {
    await prisma.channelToggle.create({
      data: {
        emoji,
        message: {
          connectOrCreate: {
            where: { id: reactionMessage.id },
            create: reactionMessage,
          },
        },
        channel: existingChannel.id,
      },
    });
    await message.react("👍");
  } catch (err) {
    logger.error("Failed to create toggle", err);
    await message.react("👎");
    return;
  }

  if (reactionMessage.channel !== null) {
    await backfillReactions(
      reactionMessage.id,
      reactionMessage.channel,
      message.guild
    );
  }
};

export async function backfillReactions(
  messageId: string,
  channelId: string,
  guild: Guild
) {
  logger.debug(
    `backfilling reactions for message ${messageId} in ${channelId}`
  );

  const channel = guild.channels.cache.find(
    (c) => c.id === channelId
  ) as TextChannel;

  if (!channel) {
    throw new Error("I can't find that channel. Maybe it has been deleted?");
  }

  const reactionDiscordMessage = await channel.messages.fetch(messageId);
  const toggles = await prisma.channelToggle.findMany({
    where: { messageId },
    orderBy: { id: "asc" },
  });

  // Only add missing reactions
  for (let i = 0; i < toggles.length; i++) {
    await reactionDiscordMessage.react(toggles[i].emoji);
  }
}

const deleteGroup = async (
  message: Message,
  requestedGroupName: string = ""
) => {
  if (!requestedGroupName) {
    await message.react("👎");
    return;
  }

  const group = await prisma.userGroup.findFirst({
    where: { name: requestedGroupName },
  });

  if (!group) {
    await message.reply("That group does not exist!");
    return;
  }

  await prisma.userGroup.delete({ where: { id: group.id } });
  await message.react("👍");
};

const searchGroup = async (
  message: Message,
  requestedGroupName: string = ""
) => {
  const groupsPerPage = 4;
  const pages: Array<MessageEmbed> = [];
  const byMemberCount = (
    a: GroupWithMemberRelationList,
    b: GroupWithMemberRelationList
  ) =>
    b.userGroupMembersGroupMembers.length -
    a.userGroupMembersGroupMembers.length;

  const copy = (
    await prisma.userGroup.findMany({
      where: {
        name: {
          contains: requestedGroupName,
          mode: "insensitive",
        },
      },
      include: { userGroupMembersGroupMembers: true },
    })
  ).sort(byMemberCount);

  if (copy.length === 0) {
    await message.reply("No matching groups were found.");
    return;
  }

  const pageAmount = Math.ceil(copy.length / groupsPerPage);

  for (let i = 0; i < pageAmount; i++) {
    const embed = new MessageEmbed({}).setAuthor(
      "YesBot",
      "https://cdn.discordapp.com/avatars/614101602046836776/61d02233797a400bc0e360098e3fe9cb.png?size=$%7BrequestedImageSize%7D"
    );
    embed.setDescription(
      `Results for group "${requestedGroupName}" (Page ${
        i + 1
      } / ${pageAmount})`
    );

    const chunk = copy.splice(0, groupsPerPage);

    chunk.forEach((group) => {
      embed.addField("Group Name:", group.name, true);
      embed.addField(
        "Number of Members:",
        group.userGroupMembersGroupMembers.length,
        true
      );
      embed.addField("Description", group.description || "-");
      embed.addField("\u200B", "\u200B");
    });

    pages.push(embed);
  }

  const flip = async (
    page: number,
    shownPageMessage: Message,
    reaction: MessageReaction
  ) => {
    if (page < 0) page = 0;
    if (page >= pages.length) page = pages.length - 1;

    await shownPageMessage.edit(message.author.toString(), {
      embed: pages[page],
    });
    await reaction.users.remove(message.author.id);
    await setupPaging(page, shownPageMessage);
  };

  const setupPaging = async (currentPage: number, pagedMessage: Message) => {
    const filter = (reaction: MessageReaction, user: User) => {
      return (
        ["⬅️", "➡️"].includes(reaction.emoji.name) &&
        user.id === message.author.id
      );
    };

    try {
      const reactions = await pagedMessage.awaitReactions(filter, {
        max: 1,
        time: 60000,
        errors: ["time"],
      });
      const first = reactions.first();
      if (first.emoji.name === "⬅️") {
        await flip(currentPage - 1, pagedMessage, first);
      }
      if (first.emoji.name === "➡️") {
        await flip(currentPage + 1, pagedMessage, first);
      }
    } catch (error) {}
  };

  const sentMessagePromise = message.channel.send(pages[0]);
  if (pages.length > 1) {
    sentMessagePromise
      .then(async (msg) => {
        await msg.react("⬅️");
        await msg.react("➡️");
        return msg;
      })
      .then((msg) => setupPaging(0, msg));
  }
};

const createGroup = async (
  message: Message,
  requestedGroupName: string,
  member: GuildMember,
  description: string
) => {
  if (!requestedGroupName) {
    await message.react("👎");
    return;
  }

  const group = await prisma.userGroup.findFirst({
    where: {
      name: requestedGroupName,
    },
  });

  if (group) {
    await message.reply("That group already exists!");
    return;
  }
  await prisma.userGroup.create({
    data: {
      name: requestedGroupName,
      description,
    },
  });
  await message.react("👍");
};

const updateGroup = async (
  message: Message,
  requestedGroupName: string,
  description: string
) => {
  if (!requestedGroupName) {
    await message.react("👎");
    return;
  }

  const group = await prisma.userGroup.findFirst({
    where: {
      name: {
        equals: requestedGroupName,
        mode: "insensitive",
      },
    },
  });

  if (!group) {
    await message.reply("That group doesn't exist!");
    return;
  }

  const previousDescription = group.description;

  await prisma.userGroup.update({
    where: { id: group.id },
    data: { description },
  });

  await message.reply(
    `Group description updated from \n> ${previousDescription} \nto \n> ${description}`
  );
};

const changeDeadtime = async (
  message: Message,
  requestedGroupName: string,
  newDeadtime: string
) => {
  const deadtimeNumber = Number(newDeadtime);
  if (isNaN(deadtimeNumber) || deadtimeNumber < 0) {
    await Tools.handleUserError(
      message,
      "Please write a postive number for the new deadtime! It will be interpreted as minutes for how long the chat needs to be dead for the group to be pinged"
    );
    return;
  }

  const group = await prisma.userGroup.findFirst({
    where: {
      name: {
        equals: requestedGroupName,
        mode: "insensitive",
      },
    },
  });

  if (!group) {
    await message.reply("That group doesn't exist!");
    return;
  }

  try {
    await prisma.userGroup.update({
      where: { id: group.id },
      data: { deadtime: deadtimeNumber },
    });
  } catch (error) {
    logger.error("Failed to update database group deadTime," + error);
    await message.react("👎");
    return;
  }

  await message.react("👍");
};

const changeGroupPingSettings = async (
  message: Message,
  requestedGroupName: string,
  option: string
) => {
  const setting = option.toLocaleLowerCase();

  if (
    (setting !== "moderator" &&
      setting !== "member" &&
      setting !== "bot" &&
      setting !== "off") ||
    !setting
  ) {
    await Tools.handleUserError(
      message,
      "Please write a valid setting for the group ping! Youre options are `moderator`, `member`, `bot` or `off`"
    );
    return;
  }
  const group = await prisma.userGroup.findFirst({
    where: {
      name: {
        equals: requestedGroupName,
        mode: "insensitive",
      },
    },
  });

  if (!group) {
    await message.reply("That group doesn't exist!");
    return;
  }

  try {
    await prisma.userGroup.update({
      where: { id: group.id },
      data: { groupPingOption: setting },
    });
  } catch (error) {
    logger.error("Failed to update database group ping settings," + error);
    await message.react("👎");
    return;
  }

  await message.react("👍");
};

const changeCooldown = async (
  message: Message,
  requestedGroupName: string,
  newCooldown: string
) => {
  const cooldownNumber = Number(newCooldown);
  if (isNaN(cooldownNumber)) {
    await Tools.handleUserError(
      message,
      "Please write a number for the new cooldown! It will be interpreted as minutes before the group can be pinged again."
    );
    return;
  }

  const group = await prisma.userGroup.findFirst({
    where: {
      name: {
        equals: requestedGroupName,
        mode: "insensitive",
      },
    },
  });

  await prisma.userGroup.update({
    where: { id: group.id },
    data: { cooldown: cooldownNumber },
  });

  await message.react("👍");
};

const joinGroup = async (
  message: Message,
  requestedGroupNames: string[],
  member: GuildMember
) => {
  await groupInteractionAndReport(
    message,
    requestedGroupNames,
    member,
    tryJoinGroups
  );
};

const leaveGroup = async (
  message: Message,
  requestedGroupNames: string[],
  member: GuildMember
) => {
  await groupInteractionAndReport(
    message,
    requestedGroupNames,
    member,
    tryLeaveGroups
  );
};

const tryJoinGroups = async (
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

const tryLeaveGroups = async (
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

const groupInteractionAndReport = async (
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

const isChannelAllowed = (channel: Channel): boolean => {
  const isTextChannel = (channel: Channel): channel is TextChannel =>
    (channel as TextChannel).name && !!(channel as TextChannel).parent;
  if (!isTextChannel(channel)) return;

  const allowedCategories = ["hobbies", "gaming"];
  const allowedChannels = [
    ChatNames.CHAT.toString(),
    ChatNames.CHAT_TOO.toString(),
    ChatNames.FOURTH_CHAT.toString(),
    ChatNames.CHAT_FIVE.toString(),
    ChatNames.VOICE_CHAT.toString(),
    ChatNames.VOICE_CHAT_TWO.toString(),
    ChatNames.SELF_DEVELOPMENT.toString(),
    ChatNames.LEARNING_SPANISH.toString(),
    ChatNames.DAILY_CHALLENGE.toString(),
    ChatNames.YESTHEORY_DISCUSSION.toString(),
  ];

  if (
    allowedCategories.some((category) =>
      channel.parent?.name?.toLowerCase()?.includes(category)
    )
  )
    return true;

  return allowedChannels.includes(channel.name);
};

const timeRemainingForDeadchat = async (message: Message, group: UserGroup) => {
  const lastMessages = (
    await message.channel.messages.fetch({ limit: 2 })
  ).array();

  if (lastMessages.length < 2) {
    return 0;
  }

  const timeDifference =
    (Date.now() - lastMessages[1].createdTimestamp) / 1000 / 60;

  return group.deadtime - Math.round(timeDifference);
};

const isGroupAllowed = (groupName: string) => {
  const memberDisabledGroups = ["yestheoryuploads"];
  return !memberDisabledGroups.includes(groupName.toLowerCase());
};

export default groupManager;
