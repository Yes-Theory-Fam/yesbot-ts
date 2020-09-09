import {
  Message,
  GuildMember,
  PartialGuildMember,
  TextChannel,
  Client,
} from "discord.js";
import { MODERATOR_ROLE_NAME, OUTPUT_CHANNEL_ID, GUILD_ID } from "../const";
import { Logger } from "./Logger";

export const isAuthorModerator = (message: Message): boolean => {
  Logger(
    "moderator",
    "isAuthorModerator",
    `Checking if author is mod: '${message.author.id}'`
  );
  if (message.member.roles.hoist) {
    return message.member.roles.hoist.name === MODERATOR_ROLE_NAME;
  } else {
    return false;
  }
};

export const hasRole = (
  member: GuildMember | PartialGuildMember,
  roleName: string
): boolean => {
  Logger(
    "moderator",
    "hasRole",
    `Checking if user has role: ${roleName} for: '${member.id}'`
  );
  return !!member.roles.cache.find((r) => r.name === roleName);
};

export const isRegistered = (
  member: GuildMember | PartialGuildMember
): boolean => {
  Logger(
    "moderator",
    "isRegistered",
    `Getting Registerd info for: '${member.id}'`
  );
  return !!member.roles.cache.find((role) => role.name.startsWith("I'm from "));
};

export const textLog = (text: string): Promise<Message> => {
  Logger("moderator", "textLog", `Sending this message: '${text}'`);
  const bot = require("..") as Client;
  const outputChannel = <TextChannel>bot.channels.resolve(OUTPUT_CHANNEL_ID);
  return outputChannel.send(text);
};

export const getMember = (userId: string): GuildMember => {
  Logger("moderator", "getMember", `Getting member info for: '${userId}'`);
  const bot = require("..") as Client;
  return bot.guilds.resolve(GUILD_ID).members.resolve(userId);
};
