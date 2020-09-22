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

import { GUILD_ID } from "../const";
import { hasRole } from "../common/moderator";
import { VoiceOnDemandRepository, VoiceOnDemandMapping } from "../entities";
import state from "../common/state";
import Tools from "../common/tools";
import { Repository } from "typeorm";

const defaultLimit = (5).toString();
const maxLimit = 10;
// Time the room has to be empty to get removed
const emptyTime = 60000;
// Time the owner of the room has left before allowing a transfer
const transferDelay = 60000;
const emojiPool = ["🐼", "🐨", "🐶", "🐵", "🐯"];

const getChannelName = (m: GuildMember, e: string) =>
  `• ${e} ${m.displayName}'s Room`;

const getVoiceChannel = async (member: GuildMember): Promise<VoiceChannel> => {
  const guild = member.guild;
  const repo = await VoiceOnDemandRepository();
  const mapping = await repo.findOne(member.id);
  return guild.channels.resolve(mapping?.channelId) as VoiceChannel;
};

export default async function (message: Message) {
  if (!hasRole(message.member, "Yes Theory")) {
    Tools.handleUserError(
      message,
      `Hey, you need to have the Yes Theory role to use this command! You can get this by talking with others in our public voice chats :grin:`
    );
    return;
  }

  const [, command] = message.content.split(" ");

  switch (command) {
    case "create":
    case "limit":
      handleLimitCommand(message);
      break;
    case "host":
      changeHostOnDemand(message);
      break;
    default:
      Tools.handleUserError(
        message,
        "Wrong syntax! Use !voice <create|limit> [limit] or !voice host @newHost"
      );
  }
}

const handleLimitCommand = (message: Message) => {
  const [, command, limitArg = defaultLimit] = message.content.split(" ");
  const requestedLimit = Math.floor(Number(limitArg));

  if (isNaN(requestedLimit)) {
    Tools.handleUserError(message, "The limit has to be a number");
    return;
  }

  if (requestedLimit < 2) {
    Tools.handleUserError(message, "The limit has to be at least 2");
    return;
  }

  const limit = Math.min(requestedLimit, maxLimit);

  switch (command) {
    case "create":
      createOnDemand(message, limit);
      break;
    case "limit":
      limitOnDemand(message, limit);
      break;
  }
};

const createOnDemand = async (message: Message, userLimit: number) => {
  const { guild, member } = message;
  const hasExisting = await getVoiceChannel(member);

  if (hasExisting) {
    Tools.handleUserError(
      message,
      "You already have an existing voice channel!"
    );
    return;
  }

  let reaction;
  try {
    reaction = await pickOneMessage(
      message,
      "Which emote would you like to have for your channel?",
      emojiPool
    );
  } catch {
    return;
  }

  const parent = guild.channels.cache.find(
    (channel) =>
      channel.name.toLowerCase().includes("conversation") &&
      channel.type === "category"
  );

  const channel = await guild.channels.create(
    getChannelName(message.member, reaction.emoji.name),
    {
      type: "voice",
      parent,
      userLimit,
    }
  );

  await channel.updateOverwrite(guild.roles.everyone, { STREAM: true });
  await channel.overwritePermissions([
    {
      id: guild.roles.everyone,
      allow: [],
      deny: [Permissions.FLAGS.CONNECT],
      type: "role",
    },
    {
      id: member.id,
      allow: [Permissions.FLAGS.CONNECT],
      deny: [],
      type: "member",
    },
  ]);

  const repo = await VoiceOnDemandRepository();
  const mapping = repo.create({
    userId: member.id,
    channelId: channel.id,
    emoji: reaction.emoji.name,
  });
  await repo.save(mapping);

  message.reply(
    `Your room was created with a limit of ${userLimit}, have fun! Don't forget, this channel will be deleted if there is noone in it. :smile:`
  );

  const timeout = setTimeout(() => deleteIfEmpty(channel), emptyTime);
  state.voiceChannels.set(channel.id, timeout);
};

const limitOnDemand = async (message: Message, limit: number) => {
  const { member } = message;
  const memberVoiceChannel = await getVoiceChannel(member);

  if (!memberVoiceChannel) {
    Tools.handleUserError(
      message,
      "You don't have a voice channel. You can create one using `!voice create` and an optional limit"
    );
    return;
  }

  memberVoiceChannel.edit({
    userLimit: limit,
  });

  message.reply(`Successfully changed the limit of your room to ${limit}`);
};

const changeHostOnDemand = async (message: Message) => {
  const { member } = message;
  const memberVoiceChannel = await getVoiceChannel(member);

  if (!memberVoiceChannel) {
    Tools.handleUserError(
      message,
      "You don't have a voice channel. You can create one using `!voice create` and an optional limit"
    );
    return;
  }

  const mentionedUser = message.mentions.users.first();
  if (!mentionedUser) {
    Tools.handleUserError(
      message,
      "You have to mention the user you want to take on ownership of your room."
    );
    return;
  }

  if (mentionedUser.id === message.author.id) {
    Tools.handleUserError(message, "Errrrr... That's yourself 🤨");
    return;
  }

  const mentionedUserInVoiceChannel = memberVoiceChannel.members.has(
    mentionedUser.id
  );

  if (!mentionedUserInVoiceChannel) {
    Tools.handleUserError(message, "That user is not in your voice channel");
    return;
  }

  const repo = await VoiceOnDemandRepository();
  const mapping = await repo.findOne(message.author.id);
  await transferOwnership(repo, mapping, mentionedUser, memberVoiceChannel);

  message.reply(`I transfered ownership of your room to <@${mentionedUser}>!`);
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
  const repo = await VoiceOnDemandRepository();

  const { channel } = newState;
  const { id } = channel;
  const mapping = await repo.findOne({ channelId: id });

  if (!mapping) return;

  const { guild } = channel;

  const timeoutRole = Tools.getRoleByName("Time Out", guild);
  const breakRole = Tools.getRoleByName("Break", guild);

  channel.overwritePermissions([
    {
      id: guild.roles.everyone,
      allow: [Permissions.FLAGS.STREAM],
      deny: [],
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
  ]);

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

  const repo = await VoiceOnDemandRepository();
  const channelId = oldState.channel.id;
  const mapping = await repo.findOne({ channelId });
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
      () => requestOwnershipTransfer(oldState.channel, repo, mapping),
      transferDelay
    );
  }

  if (oldState.channel.members.size > 0) return;

  updateTimeout(() => deleteIfEmpty(oldState.channel), emptyTime);
};

// To make sure voice channels are still cleaned up after a bot restart, we are looking through all stored channels
//  adding a timeout task to clean up in case they are empty.
export const voiceOnDemandReady = async (bot: Client) => {
  const guild = bot.guilds.resolve(GUILD_ID);
  const repo = await VoiceOnDemandRepository();
  const mappings = await repo.find();
  for (let i = 0; i < mappings.length; i++) {
    const { channelId, userId } = mappings[i];
    const channel = guild.channels.resolve(channelId) as VoiceChannel;

    // Fallback if a channel in the DB was already deleted manually
    if (channel === null) {
      removeMapping(channelId);
      return;
    }

    if (channel.members.size === 0) {
      const timeout = setTimeout(() => deleteIfEmpty(channel), emptyTime);
      state.voiceChannels.set(channelId, timeout);
    } else if (channel.members.every((member) => member.id !== userId)) {
      const timeout = setTimeout(
        () => requestOwnershipTransfer(channel, repo, mappings[i]),
        transferDelay
      );
      state.voiceChannels.set(channelId, timeout);
    }
  }
};

const removeMapping = async (channelId: string) => {
  const repo = await VoiceOnDemandRepository();
  repo.delete({ channelId });
};

const deleteIfEmpty = async (channel: VoiceChannel) => {
  // If the channel was already deleted before the 60 seconds are over, this condition is true
  // This mitigates an error trying to delete a channel that's already deleted
  if (!channel.guild.channels.resolve(channel.id)) return;
  if (channel.members.size === 0) {
    await channel.delete();
    const repo = await VoiceOnDemandRepository();
    repo.delete({ channelId: channel.id });
  }
};

const requestOwnershipTransfer = async (
  channel: VoiceChannel,
  repo: Repository<VoiceOnDemandMapping>,
  mapping: VoiceOnDemandMapping
) => {
  if (!channel.guild.channels.resolve(channel.id) || channel.members.size === 0)
    return;

  // Gotta fetch the most recent one to make sure potential updates through !voice host are still in here
  const currentMapping = await repo.findOne(mapping.userId);
  if (!currentMapping) return;

  // Owner is in there
  if (channel.members.some((member) => member.id === currentMapping.userId))
    return;

  const claimEmoji = "☝";
  const requestMessageText = `Hey, the owner of your room left! I need one of you to claim ownership of the room in the next minute, otherwise I have to delete the room. You can claim ownership by clicking the ${claimEmoji}!`;

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

  await transferMessage.delete();
  if (!claim) {
    await botCommands.send(
      getPingAll() +
        "None of you claimed ownership of the room so I am removing it."
    );
    await channel.delete();
    await repo.delete(currentMapping);
    return;
  }

  const claimingUser = claim.users.cache.filter((user) => !user.bot).first();
  await botCommands.send(
    `<@${claimingUser}>, you claimed the room! You can now change the limit of it using \`!voice limit\`.`
  );

  transferOwnership(repo, currentMapping, claimingUser, channel);
};

const transferOwnership = async (
  repo: Repository<VoiceOnDemandMapping>,
  mapping: VoiceOnDemandMapping,
  claimingUser: User,
  channel: VoiceChannel
) => {
  await repo
    .createQueryBuilder()
    .update()
    .set({ userId: claimingUser.id })
    .where("channel_id = :id", { id: channel.id })
    .execute();

  const { emoji } = mapping;
  const newChannelName = getChannelName(
    channel.guild.member(claimingUser),
    emoji
  );

  await channel.setName(newChannelName);
};

const pickOneMessage = async (
  toReplyMessage: Message,
  callToActionMessage: string,
  pickOptions: string[]
): Promise<MessageReaction> => {
  const reactMessage = await toReplyMessage.reply(callToActionMessage);
  for (let i = 0; i < pickOptions.length; i++) {
    await reactMessage.react(pickOptions[i]);
  }

  const filter = (reaction: MessageReaction, user: User) =>
    pickOptions.includes(reaction.emoji.name) &&
    user.id === toReplyMessage.author.id;

  try {
    const selection = await reactMessage.awaitReactions(filter, {
      max: 1,
      time: 60000,
      errors: ["time"],
    });
    await reactMessage.delete();
    return selection.first();
  } catch {
    await reactMessage.delete();
    Tools.handleUserError(
      toReplyMessage,
      "For technical reasons I can only wait 60 seconds for your selection."
    );
    throw "Awaiting reactions timed out";
  }
};
