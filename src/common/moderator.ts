import {
  Client,
  GuildMember,
  Message,
  MessageEmbed,
  PartialGuildMember,
  TextChannel,
} from "discord.js";

export const isAuthorModerator = (message: Message): boolean => {
  if (message.member.roles.hoist) {
    return message.member.roles.hoist.name === process.env.MODERATOR_ROLE_NAME;
  } else {
    return false;
  }
};

export const hasRole = (
  member: GuildMember | PartialGuildMember,
  roleName: string
): boolean => {
  return !!member.roles.cache.find((r) => r.name === roleName);
};

export const isRegistered = (
  member: GuildMember | PartialGuildMember
): boolean => {
  return !!member.roles.cache.find(
    (role) => role.id === process.env.MEMBER_ROLE_ID
  );
};

export const textLog = (text: string | MessageEmbed): Promise<Message> => {
  const bot = require("..") as Client;
  const outputChannel = <TextChannel>(
    bot.channels.resolve(process.env.OUTPUT_CHANNEL_ID)
  );

  return typeof text === "string"
    ? outputChannel.send(text)
    : outputChannel.send({ embeds: [text] });
};

export const getMember = (userId: string): GuildMember => {
  const bot = require("..") as Client;
  return bot.guilds.resolve(process.env.GUILD_ID).members.resolve(userId);
};
