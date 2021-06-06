import {
  Client,
  GuildMember,
  Message,
  MessageReaction,
  Permissions,
  User,
  VoiceChannel,
  VoiceState,
  TextChannel,
} from "discord.js";

import { hasRole } from "../common/moderator";
import state from "../common/state";
import Tools from "../common/tools";
import prisma from "../prisma";
import { VoiceOnDemandMapping } from "@yes-theory-fam/database/client";

const defaultLimit = (5).toString();
const maxLimit = 10;
// Time the room has to be empty to get removed
const emptyTime = 60000;
// Time the owner of the room has left before allowing a transfer
const transferDelay = 60000;
const emojiPool = ["📹", "💬", "📺", "🎲", "🎵", "🏋️"];

const getChannelName = (m: GuildMember, e: string) =>
  `• ${e} ${m.displayName}'s Room`;

const getVoiceChannel = async (member: GuildMember): Promise<VoiceChannel> => {
  const guild = member.guild;
  const mapping = await prisma.voiceOnDemandMapping.findUnique({
    where: { userId: member.id },
  });
  return guild.channels.resolve(mapping?.channelId) as VoiceChannel;
};

export default async function (message: Message) {
  const [, command] = message.content.split(" ");
  const notYesTheoryExclusiveCommands = ["knock"];

  if (
    !notYesTheoryExclusiveCommands.includes(command) &&
    !hasRole(message.member, "Yes Theory")
  ) {
    await Tools.handleUserError(
      message,
      `Hey, you need to have the Yes Theory role to use this command! You can get this by talking with others in our public voice chats :grin:`
    );
    return;
  }

  switch (command) {
    case "create":
    case "limit":
      await handleLimitCommand(message);
      break;
    case "shrink":
    case "up":
    case "down":
      await handleLimitUpdateCommand(message, command);
      break;
    case "knock":
      await knockOnDemand(message);
      break;
    case "host":
      await changeHostOnDemand(message);
      break;
    default:
      await Tools.handleUserError(
        message,
        "Wrong syntax! Use !voice <create|limit> [limit] or !voice host @newHost"
      );
  }
}

const handleLimitCommand = async (message: Message) => {
  const [, command, limitArg = defaultLimit] = message.content.split(" ");
  const requestedLimit = Math.floor(Number(limitArg));

  if (isNaN(requestedLimit)) {
    await Tools.handleUserError(message, "The limit has to be a number");
    return;
  }

  if (requestedLimit < 2) {
    await Tools.handleUserError(message, "The limit has to be at least 2");
    return;
  }

  const limit = Math.min(requestedLimit, maxLimit);

  switch (command) {
    case "create":
      await createOnDemand(message, limit);
      break;
    case "limit":
      await limitOnDemand(message, limit);
      break;
  }
};

const handleLimitUpdateCommand = async (message: Message, command: string) => {
  const getGetLimit = () => {
    switch (command) {
      case "shrink":
        return getShrinkLimit;
      case "up":
        return getUpLimit;
      case "down":
        return getDownLimit;
    }
  };

  await updateLimit(message, getGetLimit());
};

const getShrinkLimit = (channel: VoiceChannel) =>
  Math.max(2, channel.members.size);

const getUpLimit = (channel: VoiceChannel) =>
  Math.min(maxLimit, channel.userLimit + 1);

const getDownLimit = (channel: VoiceChannel) =>
  Math.max(2, channel.userLimit - 1);

const createOnDemand = async (message: Message, userLimit: number) => {
  const { guild, member } = message;
  const hasExisting = await getVoiceChannel(member);

  let reaction;
  try {
    reaction = await Tools.createVoteMessage(
      message,
      "Which emote would you like to have for your channel?",
      emojiPool,
      true
    );
  } catch {
    return;
  }

  const parent = guild.channels.cache.find(
    (channel) =>
      channel.name.toLowerCase().includes("conversation") &&
      channel.type === "category"
  );
  if (!hasExisting) {
    const channel = await guild.channels.create(
      getChannelName(message.member, reaction.emoji.name),
      {
        type: "voice",
        parent,
        userLimit,
      }
    );

    const mapping = {
      userId: member.id,
      channelId: channel.id,
      emoji: reaction.emoji.name,
    };
    try {
      await prisma.voiceOnDemandMapping.create({ data: mapping });
    } catch (e) {
      if (e.code === "P2002") {
        channel.delete();
        return;
      }
    }
    await message.reply(
      `Your room was created with a limit of ${userLimit}, have fun! Don't forget, this channel will be deleted if there is noone in it. :smile:`
    );
    const timeoutRole = Tools.getRoleByName("Time Out", guild);
    const breakRole = Tools.getRoleByName("Break", guild);

    await channel.updateOverwrite(guild.roles.everyone, { STREAM: true });
    await channel.overwritePermissions([
      {
        id: guild.roles.everyone,
        allow: [],
        deny: [Permissions.FLAGS.CONNECT],
        type: "role",
      },
      {
        id: timeoutRole.id,
        deny: [Permissions.FLAGS.CONNECT],
        type: "role",
      },
      {
        id: breakRole.id,
        deny: [Permissions.FLAGS.VIEW_CHANNEL],
        type: "role",
      },
      {
        id: member.id,
        allow: [Permissions.FLAGS.CONNECT],
        deny: [],
        type: "member",
      },
    ]);

    const timeout = setTimeout(() => deleteIfEmpty(channel), emptyTime);
    state.voiceChannels.set(channel.id, timeout);
  } else {
    await Tools.handleUserError(
      message,
      "You already have an existing voice channel!"
    );
  }
};

const limitOnDemand = async (message: Message, limit: number) => {
  await updateLimit(message, () => limit);
};

const knockOnDemand = async (message: Message) => {
  const owner = message.mentions.users.first();
  if (!owner) {
    return Tools.handleUserError(
      message,
      "You have to ping the user you want to join!"
    );
  }

  const member = message.guild.member(owner);
  const channel = await getVoiceChannel(member);

  if (!channel) {
    return Tools.handleUserError(message, "That user doesn't have a channel!");
  }

  if (channel.members.some((member) => member.user.id === message.author.id)) {
    return Tools.handleUserError(message, "You just knocked from inside!");
  }

  if (channel.members.size < channel.userLimit) {
    return Tools.handleUserError(
      message,
      "That channel has free space; you can just join!"
    );
  }

  if (channel.members.size === maxLimit) {
    return Tools.handleUserError(
      message,
      "That channel is already at the maximum limit, sorry!"
    );
  }

  const accessMessage = await message.channel.send(
    `<@${owner.id}>, <@${message.author.id}> wants to join your voice channel. Allow?`
  );

  await accessMessage.react("👍");

  const filter = (reaction: MessageReaction, user: User) =>
    user.id === owner.id && reaction.emoji.name === "👍";
  const vote = (
    await accessMessage.awaitReactions(filter, {
      max: 1,
      time: 60000,
    })
  ).first();

  await accessMessage.delete();

  if (!vote) {
    await message.reply(`sorry but ${member.displayName} didn't respond.`);
    return;
  }

  await message.reply("you were let in!");

  // Blatant hack to abuse existing API
  message.author = owner;
  await updateLimit(message, getUpLimit);
};

const updateLimit = async (
  message: Message,
  getLimit: (channel: VoiceChannel) => Promise<number> | number
) => {
  const { member } = message;
  const memberVoiceChannel = await getVoiceChannel(member);

  if (!memberVoiceChannel) {
    await Tools.handleUserError(
      message,
      "You don't have a voice channel. You can create one using `!voice create` and an optional limit"
    );
    return;
  }

  const limit = await getLimit(memberVoiceChannel);

  await memberVoiceChannel.edit({
    userLimit: limit,
  });

  await message.reply(
    `Successfully changed the limit of your room to ${limit}`
  );
};

const changeHostOnDemand = async (message: Message) => {
  const { member } = message;
  const memberVoiceChannel = await getVoiceChannel(member);

  if (!memberVoiceChannel) {
    await Tools.handleUserError(
      message,
      "You don't have a voice channel. You can create one using `!voice create` and an optional limit"
    );
    return;
  }

  const mentionedMember = message.mentions.members.first();
  if (!mentionedMember) {
    await Tools.handleUserError(
      message,
      "You have to mention the user you want to take on ownership of your room."
    );
    return;
  }
  const mentionedMemberVoiceChannel = await getVoiceChannel(mentionedMember);
  if (mentionedMemberVoiceChannel) {
    await Tools.handleUserError(
      message,
      "This user already has a voice channel!"
    );
    return;
  }

  if (mentionedMember.id === message.author.id) {
    await Tools.handleUserError(message, "Errrrr... That's yourself 🤨");
    return;
  }

  const mentionedMemberInVoiceChannel = memberVoiceChannel.members.has(
    mentionedMember.id
  );

  if (!mentionedMemberInVoiceChannel) {
    await Tools.handleUserError(
      message,
      "That user is not in your voice channel"
    );
    return;
  }

  if (!hasRole(mentionedMember, "Yes Theory")) {
    await Tools.handleUserError(
      message,
      "That user doesn't have the Yes Theory role required to control the room. Pick someone else or get a Support to give them the Yes Theory role."
    );
    return;
  }

  const mapping = await prisma.voiceOnDemandMapping.findUnique({
    where: { userId: message.author.id },
  });

  await transferOwnership(mapping, mentionedMember.user, memberVoiceChannel);

  await message.reply(
    `I transfered ownership of your room to <@${mentionedMember}>!`
  );
};

export const voiceOnDemandPermissions = async (
  oldState: VoiceState,
  newState: VoiceState
) => {
  // User leaving voice channel or remaining in the same channel are not relevant
  if (!newState.channel || oldState.channel === newState.channel) return;

  // Because this should only trigger when the owner (as first person) joins, we can ignore
  //  all joins where more than one person is in the room after a person joined
  if (newState.channel.members.size > 1) return;

  const { channel } = newState;
  const { id } = channel;
  const mapping = await prisma.voiceOnDemandMapping.findUnique({
    where: { channelId: id },
  });

  if (!mapping) return;

  const { guild } = channel;

  await channel.updateOverwrite(guild.roles.everyone, {
    STREAM: true,
    CONNECT: null,
  });

  // Comment to restart
  // We don't need this overwrite anymore
  channel.permissionOverwrites.get(mapping.userId)?.delete();
};

// I would like to keep the function here so everything belongs together as piece.
// That way you can import voiceStateUpdate functions from different modules in VoiceStateUpdate with less chaos (imo)
export const voiceOnDemandReset = async (
  oldState: VoiceState,
  newState: VoiceState
) => {
  // If there is no old channel, the user didn't leave anything
  // If old and new channel are the same, the channel still has
  //  the same amount of users in so it's not relevant for our purpose
  if (!oldState.channel || oldState.channelID === newState.channelID) return;

  const channelId = oldState.channel.id;
  const mapping = await prisma.voiceOnDemandMapping.findUnique({
    where: { channelId },
  });
  if (!mapping) return;

  type TimeoutFunction = () => void;
  const updateTimeout = (newFunction: TimeoutFunction, newDuration: number) => {
    const timeout = state.voiceChannels.get(channelId);
    if (timeout) clearTimeout(timeout);

    const newTimeout = setTimeout(newFunction, newDuration);
    state.voiceChannels.set(channelId, newTimeout);
  };

  if (mapping.userId === newState.member.id) {
    updateTimeout(
      () => requestOwnershipTransfer(oldState.channel, mapping),
      transferDelay
    );
  }

  // This condition is doubled from the top but required because discord.js...
  if (!oldState.channel || oldState.channel.members.size > 0) return;

  updateTimeout(() => deleteIfEmpty(oldState.channel), emptyTime);
};

// To make sure voice channels are still cleaned up after a bot restart, we are looking through all stored channels
//  adding a timeout task to clean up in case they are empty.
export const voiceOnDemandReady = async (bot: Client) => {
  const guild = bot.guilds.resolve(process.env.GUILD_ID);
  const mappings = await prisma.voiceOnDemandMapping.findMany();
  for (let i = 0; i < mappings.length; i++) {
    const { channelId, userId } = mappings[i];
    const channel = guild.channels.resolve(channelId) as VoiceChannel;

    // Fallback if a channel in the DB was already deleted manually
    if (channel === null) {
      await removeMapping(channelId);
      return;
    }

    if (channel.members.size === 0) {
      const timeout = setTimeout(() => deleteIfEmpty(channel), emptyTime);
      state.voiceChannels.set(channelId, timeout);
    } else if (channel.members.every((member) => member.id !== userId)) {
      const timeout = setTimeout(
        () => requestOwnershipTransfer(channel, mappings[i]),
        transferDelay
      );
      state.voiceChannels.set(channelId, timeout);
    }
  }
};

const removeMapping = async (channelId: string) => {
  await prisma.voiceOnDemandMapping.delete({ where: { channelId } });
};

const deleteIfEmpty = async (channel: VoiceChannel) => {
  // If the channel was already deleted before the 60 seconds are over, this condition is true
  // This mitigates an error trying to delete a channel that's already deleted
  if (!channel || !channel.guild.channels.resolve(channel.id)) return;
  if (channel.members.size === 0) {
    await channel.delete();
    await prisma.voiceOnDemandMapping.delete({
      where: { channelId: channel.id },
    });
  }
};

const requestOwnershipTransfer = async (
  channel: VoiceChannel,
  mapping: VoiceOnDemandMapping
) => {
  if (!channel.guild.channels.resolve(channel.id) || channel.members.size === 0)
    return;

  // Gotta fetch the most recent one to make sure potential updates through !voice host are still in here
  const currentMapping = await prisma.voiceOnDemandMapping.findUnique({
    where: { userId: mapping.userId },
  });
  if (!currentMapping) return;

  // Owner is in there
  if (channel.members.some((member) => member.id === currentMapping.userId))
    return;

  const claimEmoji = "☝";
  const requestMessageText = `Hey, the owner of your room left! I need one of you to claim ownership of the room in the next minute, otherwise I'll pick someone randomly. You can claim ownership by clicking the ${claimEmoji}!`;

  // Functions to get the most recent values whenever needed (so you cannot leave the channel and claim ownership)
  const getMemberIds = () => channel.members.map((member) => member.id);
  const getPingAll = () =>
    getMemberIds()
      .map((id) => `<@${id}>`)
      .join(", ") + " ";

  const botCommands = channel.guild.channels.cache.find(
    (channel) => channel.name === "bot-commands"
  ) as TextChannel;
  const transferMessage = await botCommands.send(
    getPingAll() + requestMessageText
  );
  await transferMessage.react(claimEmoji);

  const filter = (reaction: MessageReaction, user: User) =>
    reaction.emoji.name === claimEmoji && getMemberIds().includes(user.id);
  const claim = (
    await transferMessage.awaitReactions(filter, {
      max: 1,
      time: 60000,
    })
  ).first();

  if (getMemberIds().length < 1) {
    return;
  }

  if (!claim) {
    await botCommands.send(
      getPingAll() +
        "None of you claimed ownership of the room so I shall assign someone randomly!"
    );
  }

  const claimingUser = claim
    ? claim.users.cache
        .filter((user) => getMemberIds().includes(user.id))
        .first()
    : channel.members.random().user;
  const claimingUserGuild = await channel.guild.members.fetch(claimingUser);
  const claimingUserVoiceChannel = await getVoiceChannel(claimingUserGuild);

  if (channel.members.size === 1 && claimingUserVoiceChannel !== null) {
    channel.delete();
    await prisma.voiceOnDemandMapping.delete({
      where: { channelId: channel.id },
    });
    await transferMessage.delete();
    await botCommands.send(
      `<@${claimingUser}>, I have deleted the channel you are in as you already have one!`
    );
  }

  if (claimingUserVoiceChannel !== null && channel.members.size > 1) {
    // if no user reacts, this verifies the random user selected does not have a room.
    if (
      transferMessage.reactions.cache.get("☝").count === 1 &&
      claimingUserVoiceChannel !== null
    ) {
      const voiceChannelUsers = channel.members;
      const memberFilter = voiceChannelUsers.filter(
        (member) => member !== claimingUserGuild
      );
      const randomUser = memberFilter.random().user; //Randomizer with filter to make sure the user with a room isn't picked again.
      await transferMessage.delete();
      await botCommands.send(
        `<@${randomUser}> is now the new owner of the room! You can change the limit of it using \`!voice limit\`.`
      );
      await transferOwnership(currentMapping, randomUser, channel);
    } else {
      await transferMessage.delete();
      await botCommands.send(
        `<@${claimingUser}>, you cannot claim the room as you already have a room, I shall assign someone randomly!`
      );

      //Randomizer with filter to make sure the user with a room isn't picked again.
      const voiceChannelUsers = channel.members;
      const memberFilter = voiceChannelUsers.filter(
        (member) => member !== claimingUserGuild
      );
      const randomUser = memberFilter.random().user;
      await botCommands.send(
        `<@${randomUser}> is now the new owner of the room! You can change the limit of it using \`!voice limit\`.`
      );
      await transferOwnership(currentMapping, randomUser, channel);
    }
  }

  if (claimingUserVoiceChannel === null) {
    await transferMessage.delete();
    await botCommands.send(
      `<@${claimingUser}>, is now the new owner of the room! You can now change the limit of it using \`!voice limit\`.`
    );
    await transferOwnership(currentMapping, claimingUser, channel);
  }
};

const transferOwnership = async (
  mapping: VoiceOnDemandMapping,
  claimingUser: User,
  channel: VoiceChannel
) => {
  await prisma.voiceOnDemandMapping.update({
    where: { channelId: channel.id },
    data: { userId: claimingUser.id },
  });

  const { emoji } = mapping;
  const newChannelName = getChannelName(
    channel.guild.member(claimingUser),
    emoji
  );

  await channel.setName(newChannelName);
};
