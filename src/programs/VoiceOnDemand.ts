import { Message, GuildMember, VoiceState, VoiceChannel } from "discord.js";

import { hasRole } from "../common/moderator";
import { VoiceOnDemandRepository } from "../entities/VoiceOnDemandMapping";

const getChannelName = (m: GuildMember) => `• 🔈 ${m.displayName}'s Room`;

const getVoiceChannel = async (member: GuildMember) => {
  const guild = member.guild;
  const repo = await VoiceOnDemandRepository();
  const mapping = await repo.findOne(member.id);
  return guild.channels.resolve(mapping?.channelId);
};

export default async function (message: Message) {
  if (!hasRole(message.member, "Yes Theory")) {
    message.reply(
      `Hey, you need to have the ${message.guild.roles.cache
        .find((r) => r.name === "Yes Theory")
        .toString()} to use this command! You can get this by talking with others in our public voice chats :grin:`
    );
    return;
  }

  const [, command, limitArg = "10"] = message.content.split(" ");
  const requestedLimit = Number(limitArg);
  const maxLimit = 10;

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

const createOnDemand = async (message: Message, userLimit: number) => {
  const { guild, member } = message;
  const hasExisting = await getVoiceChannel(member);

  if (hasExisting) {
    message
      .reply("You already have an existing voice channel!")
      .then((message) => message.delete({ timeout: 10000 }));
    return;
  }

  const parent = guild.channels.cache.find(
    (channel) =>
      channel.name.toLowerCase().includes("private") &&
      channel.type === "category"
  );

  const channel = await guild.channels.create(getChannelName(message.member), {
    type: "voice",
    parent,
    userLimit,
  });

  await channel.updateOverwrite(guild.roles.everyone, { STREAM: true });

  const repo = await VoiceOnDemandRepository();
  const mapping = repo.create({
    userId: member.id,
    channelId: channel.id,
  });
  await repo.save(mapping);

  message.reply(
    `Your room was created with a limit of ${userLimit}, have fun! Don't forget, this channel will be deleted if there is noone in it. :smile:`
  );

  setTimeout(() => deleteIfEmpty(channel), 60000);
};

const limitOnDemand = async (message: Message, limit: number) => {
  const { member } = message;
  const memberVoiceChannel = await getVoiceChannel(member);

  if (!memberVoiceChannel) {
    message
      .reply(
        "You don't have a voice channel. You can create one using `!voice create` and an optional limit"
      )
      .then((message) => message.delete({ timeout: 10000 }));
    return;
  }

  memberVoiceChannel.edit({
    userLimit: limit,
  });

  message.reply(`Successfully changed the limit of your room to ${limit}`);
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
  if (!oldState.channel || oldState.channel === newState.channel) return;

  const repo = await VoiceOnDemandRepository();

  const channelId = oldState.channel.id;
  const hasMapping = await repo.findOne({ channelId });

  if (!hasMapping) return;

  deleteIfEmpty(oldState.channel);
};

const deleteIfEmpty = async (channel: VoiceChannel) => {
  // If the channel was already deleted before the 60 seconds are over, this condition is true
  // This mitigates an error trying to delete a channel that's already deleted
  if (!channel.guild.channels.resolve(channel.id)) return;
  if (channel.members.size === 0) {
    channel.delete();
    const repo = await VoiceOnDemandRepository();
    repo.delete({ channelId: channel.id });
  }
};
