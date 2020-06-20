import { Message, CategoryChannel, VoiceChannel, VoiceState, Snowflake } from 'discord.js';
import state from '../common/state';

const timeout = 60 * 1000;
const minPeople = 1;

export default async function (message: Message) {
  const [, command, limitArg = "15"] = message.content.split(" ");
  const requestedLimit = Number(limitArg);
  const maxLimit = 30;

  if (isNaN(requestedLimit)) {
    message.reply("The limit has to be a number");
    return;
  }

  if (requestedLimit < 2) {
    message.reply("The limit has to be at least 2");
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
}

const createOnDemand = async (message: Message, limit: number) => {
  const { id, username } = message.author;
  const hasExisting = state.voiceChannels.has(id);

  if (hasExisting) {
    message.reply("You already have an existing voice channel!").then(message => message.delete({ timeout: 10000 }));
    return;
  }

  const guild = message.guild;
  const category = guild.channels.cache.find(channel => channel.name.toLowerCase().endsWith("voice"));
  if (!category || !(category instanceof CategoryChannel)) {
    // TODO add logging
    return;
  }

  const channel = await guild.channels.create(`${username}'s room`, {
    type: "voice",
    parent: category,
    userLimit: limit,
  });
  await channel.updateOverwrite(guild.roles.everyone, { STREAM: true });

  state.voiceChannels.set(id, { channelId: channel.id, timeouts: [] });

  message.reply(`Your room was created with a limit of ${limit}, have fun :smile:`);

  const timeoutId = setTimeout(() => checkForDelete(channel), timeout);
  state.voiceChannels.get(id).timeouts.push(timeoutId);
}

const limitOnDemand = (message: Message, limit: number) => {
  const { id } = message.author;
  const { channelId } = state.voiceChannels.get(id);
  if (!channelId) {
    message.reply("You don't have a voice channel. You can create one using `!voice create` and an optional limit").then(message => message.delete({ timeout: 10000 }));
    return;
  }

  const channel = message.guild.channels.resolve(channelId);
  if (!(channel instanceof VoiceChannel)) {
    return;
  }

  channel.edit({
    userLimit: limit,
  });

  message.reply(`Successfully changed the limit of your room to ${limit}`);
}

export const voiceOnDemandReset = async (oldState: VoiceState, newState: VoiceState) => {
  // Not sure if that's a thing but better be safe than sorry
  if (!oldState.channel && !newState.channel) return;

  // Someone joining, if we find a stored channel for that, clear all checking intervals
  if (!oldState.channel) {
    const entry = entryForChannelId(newState.channel.id);
    if (!entry) return;

    const [, { timeouts }] = entry;
    const killTimeouts = timeouts.splice(0, timeouts.length);

    killTimeouts.forEach((timeout) => {
      clearTimeout(timeout);
    });

    return;
  };

  // To avoid events like muting
  if (oldState?.channel?.id === newState?.channel?.id) return;

  const newChannel = newState.channel;
  const oldChannel = oldState.channel;

  // User left oldChannel
  if (!newChannel || newChannel.id !== oldChannel.id) {
    if (oldChannel.members.size < minPeople) {
      const timeoutId = setTimeout(() => checkForDelete(oldChannel), timeout);
      const [, { timeouts }] = entryForChannelId(oldChannel.id);
      timeouts.push(timeoutId);
    }
  }
};

const checkForDelete = (channel: VoiceChannel) => {
  // It can happen that the callback runs more than once which can cause the attempt to delete a channel while it's already gone
  if (!channel.guild.channels.resolve(channel.id)) return;

  if (channel.members.size < minPeople) {
    // TODO Discord logging
    console.log(`Less than two people remaining in ${channel.name}! Resetting name and permissions.`);
    channel.delete();

    const [userId] = entryForChannelId(channel.id);
    state.voiceChannels.delete(userId);
  }
}

const entryForChannelId = (id: Snowflake) => {
  const entryIterator = state.voiceChannels.entries();
  let entry = entryIterator.next();
  while (!entry.done) {
    const value: [Snowflake, { channelId: Snowflake, timeouts: Array<NodeJS.Timeout> }] = entry.value;
    const [userId, { channelId }] = value;
    if (channelId === id) {
      return value;
    }
    entry = entryIterator.next();
  }
}
