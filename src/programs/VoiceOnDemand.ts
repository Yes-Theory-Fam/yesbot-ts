import { Message, Guild, GuildMember } from "discord.js";

import { hasRole } from "../common/moderator";

const getChannelName = (m: GuildMember) => `• 🔈 ${m.displayName}`;
export const getVoiceChannel = (guild: Guild, member: GuildMember) =>
  guild.channels.cache.find((c) => c.name === getChannelName(member));

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
  const hasExisting = getVoiceChannel(guild, member);

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

  message.reply(
    `Your room was created with a limit of ${userLimit}, have fun! Don't forget, this channel will be deleted if you leave it. :smile:`
  );
};

const limitOnDemand = (message: Message, limit: number) => {
  const { guild, member } = message;
  const memberVoiceChannel = getVoiceChannel(guild, member);

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
