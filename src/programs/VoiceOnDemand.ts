import {
  Message,
  GuildMember,
  VoiceState,
  VoiceChannel,
  Permissions,
  Client, Emoji, MessageReaction, User,
} from "discord.js";

import { hasRole } from "../common/moderator";
import state from "../common/state";
import { GUILD_ID } from "../const";
import { VoiceOnDemandRepository } from "../entities/VoiceOnDemandMapping";

const defaultLimit = (5).toString();
const maxLimit = 10;
const emptyTime = 60000;
const emojiPool = ["🤭", "🎲", "🎮", "🎶", "🔈"];

const getChannelName = (m: GuildMember, e: Emoji) => `• ${e.name} ${m.displayName}'s Room`;

const getVoiceChannel = async (member: GuildMember) => {
  const guild = member.guild;
  const repo = await VoiceOnDemandRepository();
  const mapping = await repo.findOne(member.id);
  return guild.channels.resolve(mapping?.channelId);
};

export default async function (message: Message) {
  if (!hasRole(message.member, "Yes Theory")) {
    message.reply(
      `Hey, you need to have the Yes Theory role to use this command! You can get this by talking with others in our public voice chats :grin:`
    );
    return;
  }

  const [, command, limitArg = defaultLimit] = message.content.split(" ");
  const requestedLimit = Number(limitArg);

  if (isNaN(requestedLimit)) {
    error(message, "The limit has to be a number");
    return;
  }

  if (requestedLimit < 2) {
    error(message, "The limit has to be at least 2");
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
    default:
      error(message, "Wrong syntax! Use !voice <create|limit> [limit]");
  }
}

const createOnDemand = async (message: Message, userLimit: number) => {
  const { guild, member } = message;
  const hasExisting = await getVoiceChannel(member);

  if (hasExisting) {
    error(message, "You already have an existing voice channel!");
    return;
  }

  let reaction;
  try {
    reaction = await pickOneMessage(message, "Which emote would you like to have for your channel?", emojiPool);
  } catch {
    return;
  }

  const parent = guild.channels.cache.find(
    (channel) =>
      channel.name.toLowerCase().includes("conversation") &&
      channel.type === "category"
  );

  const channel = await guild.channels.create(getChannelName(message.member, reaction.emoji), {
    type: "voice",
    parent,
    userLimit,
  });

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
    error(
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

  channel.overwritePermissions([
    {
      id: guild.roles.everyone,
      allow: [Permissions.FLAGS.STREAM],
      deny: [],
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

  const channelId = oldState.channel.id;
  const timeout = state.voiceChannels.get(channelId);
  clearTimeout(timeout);

  const repo = await VoiceOnDemandRepository();

  const hasMapping = await repo.findOne({ channelId });

  if (!hasMapping) return;

  const newTimeout = setTimeout(
    () => deleteIfEmpty(oldState.channel),
    emptyTime
  );
  state.voiceChannels.set(channelId, newTimeout);
};

// To make sure voice channels are still cleaned up after a bot restart, we are looking through all stored channels
//  adding a timeout task to clean up in case they are empty.
export const voiceOnDemandReady = async (bot: Client) => {
  const guild = bot.guilds.resolve(GUILD_ID);
  const repo = await VoiceOnDemandRepository();
  const mappings = await repo.find();
  for (let i = 0; i < mappings.length; i++) {
    const { channelId } = mappings[i];
    const channel = guild.channels.resolve(channelId) as VoiceChannel;
    if (channel.members.size === 0) {
      const timeout = setTimeout(() => deleteIfEmpty(channel), emptyTime);
      state.voiceChannels.set(channelId, timeout);
    }
  }
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

const error = (message: Message, reply: string) => {
  message.reply(reply).then((msg) => {
    message.delete();
    msg.delete({ timeout: 10000 });
  });
};

const pickOneMessage = async (toReplyMessage: Message, callToActionMessage: string, pickOptions: string[]) => {
  const reactMessage = await toReplyMessage.reply(callToActionMessage);
  for (let i = 0; i < pickOptions.length; i++) {
    await reactMessage.react(pickOptions[i]);
  }

  const filter = (reaction: MessageReaction, user: User) =>
    pickOptions.includes(reaction.emoji.name) && user.id === toReplyMessage.author.id;

  try {
    const selection = await reactMessage.awaitReactions(filter, { max: 1, time: 60000 });
    return selection.first();
  } catch {
    await reactMessage.delete();
    error(toReplyMessage, "For technical reasons I can only wait 60 seconds for your selection.");
    throw "Awaiting reactions timed out";
  }
}
