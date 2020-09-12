import {
  Channel,
  Guild,
  GuildMember,
  Message,
  MessageEmbed,
  MessageReaction,
  TextChannel,
  User,
} from "discord.js";
import Tools from "../common/tools";
import { ENGINEER_ROLE_NAME } from "../const";
import { isAuthorModerator } from "../common/moderator";
import {
  ChannelToggleRepository,
  getOrCreateMessage,
  GroupMember,
  UserGroup,
  UserGroupMembershipRepository,
  UserGroupRepository,
} from "../entities";
import {
  GroupInteractionError,
  GroupInteractionSuccess,
} from "../common/interfaces";
import { ILike } from "../lib/typeormILIKE";
import { Repository } from "typeorm";

type GroupInteractionInformation =
  | GroupInteractionSuccess
  | GroupInteractionError;

const isSuccess = (
  result: GroupInteractionInformation
): result is GroupInteractionSuccess => result.success;

export default async function GroupManager(
  message: Message,
  isConfig: boolean
) {
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
      ].includes(action)
    ) {
      const helpMessage = `Incorrect syntax, please use the following: \`!group join|leave|create|search|delete|update|changeCooldown\`. If you need additional help, react with 🛠️ below to tag a ${ENGINEER_ROLE_NAME}`;
      await message.reply(helpMessage);
      return;
    }

    const user = message.member;
    const moderator = isAuthorModerator(message);

    switch (action) {
      case "join":
        joinGroup(message, [requestName, ...rest], user);
        break;

      case "toggle":
        toggleGroup(words, message);
        break;

      case "create":
        if (moderator) createGroup(message, requestName, user, description);
        else
          Tools.handleUserError(
            message,
            "You do not have permission to use this command."
          );
        break;

      case "leave":
        leaveGroup(message, [requestName, ...rest], user);
        break;

      case "search":
        searchGroup(message, requestName);
        break;

      case "delete":
        if (moderator) deleteGroup(message, requestName);
        else
          Tools.handleUserError(
            message,
            "You do not have permission to use this command."
          );
        break;

      case "update": {
        moderator
          ? updateGroup(message, requestName, description)
          : Tools.handleUserError(
              message,
              "You do not have permission to use this command."
            );
      }
      case "changeCooldown": {
        moderator
          ? changeCooldown(message, requestName, description)
          : Tools.handleUserError(
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

    const groupRepository = await UserGroupRepository();

    const groupTriggerStart = content.substring(content.indexOf("@group"));
    const args = <string[]>groupTriggerStart.split(/\s/g);

    args.shift();
    const [requestName] = args;
    const groups = await groupRepository.find({
      relations: ["members"],
    });
    const matchingGroups = groups.filter(
      (group: UserGroup) =>
        group.name.toLowerCase() == requestName.toLowerCase()
    );

    if (matchingGroups.length === 0) {
      message.reply("I couldn't find that group.");
      return;
    }

    const group = matchingGroups[0];
    const timeDifference = (Date.now() - group.lastUsed.getTime()) / 1000 / 60;

    if (timeDifference < group.cooldown) {
      const remainingCooldown = group.cooldown - Math.round(timeDifference);
      Tools.handleUserError(
        message,
        `Sorry, this group was already pinged within the last ${group.cooldown} minutes; it's about ${remainingCooldown} minutes left until you can ping it again.`
      );
      return;
    }

    const groupPingMessage =
      `**@${group.name}**: ` +
      group.members.map((member) => `<@${member.id}>`).join(", ");

    message.channel.send(groupPingMessage, { split: { char: "," } });

    group.lastUsed = new Date();
    groupRepository.save(group);
  }
}

const toggleGroup = async (words: string[], message: Message) => {
  if (!isAuthorModerator(message)) {
    message.react("👎");
    return;
  }

  words.shift();
  const [messageId, emoji, channelName] = words;
  if (!(messageId && emoji && channelName)) {
    message.react("👎");
    message.reply(
      "Invalid syntax, please double check for messageId, emoji, channelName and try again."
    );
    return;
  }
  const existingChannel = message.guild.channels.cache.find(
    (c) => c.name === channelName.toLowerCase()
  );
  if (!existingChannel) {
    message.react("👎");
    message.reply("That channel doesn't exist here.");
    return;
  }

  const reactionMessage = await getOrCreateMessage(messageId);

  if (reactionMessage.channel === null) {
    message.reply(
      "Since this is the first time I've heard of this message I need your help. " +
        `Can you put one ${emoji} emoji on the message for me please?\n` +
        "After you've done that, I'll make sure to put up all the emojis on it. :grin:\n" +
        "You can keep adding emojis here and add one on the original message when you're done, and I'll add them all!"
    );
  }

  const channelToggleRepository = await ChannelToggleRepository();

  try {
    const toggle = channelToggleRepository.create({
      emoji,
      message: reactionMessage,
      channel: existingChannel.id,
    });
    await channelToggleRepository.save(toggle);
    message.react("👍");
  } catch (err) {
    console.error("Failed to create toggle", err);
    message.react("👎");
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
  console.log(`backfilling reactions for message ${messageId} in ${channelId}`);
  const channelToggleRepository = await ChannelToggleRepository();

  const channel = guild.channels.cache.find(
    (c) => c.id === channelId
  ) as TextChannel;

  if (channel === undefined) {
    throw new Error("I can't find that channel. Maybe it has been deleted?");
  }

  const reactionDiscordMessage = await channel.messages.fetch(messageId);
  const toggles = await channelToggleRepository.find({
    where: {
      message: messageId,
    },
    order: {
      id: "ASC",
    },
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
    message.react("👎");
    return;
  }

  const groupRepository = await UserGroupRepository();
  const group = await groupRepository.findOne({
    where: {
      name: requestedGroupName,
    },
  });

  if (group === undefined) {
    await message.reply("That group does not exist!");
    return;
  }

  await groupRepository.delete(group.id);
  await message.react("👍");
};

const searchGroup = async (
  message: Message,
  requestedGroupName: string = ""
) => {
  const groupRepository = await UserGroupRepository();

  const groupsPerPage = 4;
  const pages: Array<MessageEmbed> = [];
  const byMemberCount = (a: UserGroup, b: UserGroup) =>
    b.members.length - a.members.length;

  const copy = (
    await groupRepository.find({
      where: {
        name: ILike(`%${requestedGroupName}%`),
      },
      relations: ["members"],
    })
  ).sort(byMemberCount);

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
      embed.addField("Number of Members:", group.members.length, true);
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
    setupPaging(page, shownPageMessage);
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
        flip(currentPage - 1, pagedMessage, first);
      }
      if (first.emoji.name === "➡️") {
        flip(currentPage + 1, pagedMessage, first);
      }
    } catch (error) {}
  };

  const sentMessagePromise = message.channel.send(
    message.author.toString(),
    pages[0]
  );
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
    message.react("👎");
    return;
  }

  const groupRepository = await UserGroupRepository();
  const group = await groupRepository.findOne({
    where: {
      name: requestedGroupName,
    },
  });

  if (group !== undefined) {
    await message.reply("That group already exists!");
    return;
  }

  const newGroup = groupRepository.create({
    name: requestedGroupName,
    description,
  });

  await groupRepository.save(newGroup);
  await message.react("👍");
};

const updateGroup = async (
  message: Message,
  requestedGroupName: string,
  description: string
) => {
  if (!requestedGroupName) {
    message.react("👎");
    return;
  }

  const groupRepository = await UserGroupRepository();
  const group = await groupRepository.findOne({
    where: {
      name: ILike(requestedGroupName),
    },
  });

  if (group === undefined) {
    await message.reply("That group doesn't exist!");
    return;
  }

  const previousDescription = group.description;

  group.description = description;
  await groupRepository.save(group);

  await message.reply(
    `Group description updated from \n> ${previousDescription} \nto \n> ${group.description}`
  );
};

const changeCooldown = async (
  message: Message,
  requestedGroupName: string,
  newCooldown: string
) => {
  const cooldownNumber = Number(newCooldown);
  if (isNaN(cooldownNumber)) {
    Tools.handleUserError(
      message,
      "Please write a number for the new cooldown! It will be interpreted as minutes before the group can be pinged again."
    );
    return;
  }

  const repo = await UserGroupRepository();
  const group = await repo.findOne({
    where: {
      name: ILike(requestedGroupName),
    },
  });

  group.cooldown = cooldownNumber;
  repo.save(group);
  message.react("👍");
};

const joinGroup = async (
  message: Message,
  requestedGroupNames: string[],
  member: GuildMember
) => {
  groupInteractionAndReport(
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
  groupInteractionAndReport(
    message,
    requestedGroupNames,
    member,
    tryLeaveGroups
  );
};

const tryJoinGroups = async (
  groups: UserGroup[],
  member: GuildMember,
  groupRepository: Repository<UserGroup>
): Promise<GroupInteractionInformation[]> => {
  const results: GroupInteractionInformation[] = [];
  const userGroupMembershipRepository = await UserGroupMembershipRepository();
  const newGroupMember = userGroupMembershipRepository.create({
    id: member.id,
  });

  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];

    if (group.members.some((m: GroupMember) => m.id === member.id)) {
      results.push({
        groupName: group.name,
        success: false,
        message: "You are already in that group!",
      });
      continue;
    }

    const membership = await userGroupMembershipRepository.save(newGroupMember);
    groupRepository.save({
      ...group,
      members: [...group.members, membership],
    });

    results.push({
      groupName: group.name,
      success: true,
    });
  }

  return results;
};

const tryLeaveGroups = async (
  groups: UserGroup[],
  member: GuildMember,
  groupRepository: Repository<UserGroup>
): Promise<GroupInteractionInformation[]> => {
  const results: GroupInteractionInformation[] = [];

  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];

    const updatedMemberList = group.members.filter(
      (m: GroupMember) => m.id !== member.id
    );

    if (updatedMemberList.length === group.members.length) {
      results.push({
        success: false,
        groupName: group.name,
        message: "You are not in that group!",
      });
      continue;
    }

    groupRepository.save({
      ...group,
      members: updatedMemberList,
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
    groups: UserGroup[],
    member: GuildMember,
    groupRepository: Repository<UserGroup>
  ) => Promise<GroupInteractionInformation[]>
) => {
  if (requestedGroupNames.filter((name) => name).length === 0) {
    Tools.handleUserError(
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

  const groupRepository = await UserGroupRepository();

  const whereCondition = uniqueGroupNames.map((groupName) => ({
    name: ILike(groupName),
  }));

  const groups = await groupRepository.find({
    where: whereCondition,
    relations: ["members"],
  });

  if (groups === undefined || groups.length === 0) {
    message.reply("I couldn't find any of the requested groups.");
    return;
  }

  const tryResult = await interaction(groups, member, groupRepository);
  if (tryResult.length === 1) {
    const result = tryResult[0];

    if (isSuccess(result)) {
      message.react("👍");
    } else {
      message.react("👎");
      message.reply(result.message);
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

  message.reply("\n" + report.join("\n"));
};

const isChannelAllowed = (channel: Channel): boolean => {
  const isTextChannel = (channel: Channel): channel is TextChannel =>
    (channel as TextChannel).name && !!(channel as TextChannel).parent;
  if (!isTextChannel(channel)) return;

  const allowedCategories = ["hobbies", "gaming"];
  const allowedChannels = [
    "449984633908625409", // Chat
    "623565093166252052", // Chat-too
    "508918747533410304", // learning-spanish
    "450187015221280769", // voice-chat
    "747189756302983199", // 4th-chat
  ];

  if (
    allowedCategories.some((category) =>
      channel.parent?.name?.toLowerCase()?.includes(category)
    )
  )
    return true;

  return allowedChannels.includes(channel.id);
};
