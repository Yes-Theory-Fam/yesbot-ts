import {
  Client,
  GuildMember,
  Message,
  PartialGuildMember,
  TextChannel,
} from "discord.js";
import { ChatNames } from "../collections/chat-names";
import prisma from "../prisma";

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

export const isUserTimedOut = async (
  member: GuildMember | PartialGuildMember
): Promise<boolean> => {
  return !!(await prisma.timedOutUsers.findFirst({
    where: {
      userId: member.id,
    },
  }));
};

export const textLog = (text: string): Promise<Message> => {
  const bot = require("..") as Client;
  const outputChannel = <TextChannel>(
    bot.channels.resolve(process.env.OUTPUT_CHANNEL_ID)
  );
  return outputChannel.send(text);
};

export const getMember = (userId: string): GuildMember => {
  const bot = require("..") as Client;
  return bot.guilds.resolve(process.env.GUILD_ID).members.resolve(userId);
};

export const removeTimeOutRole = async (message: Message) => {
  const unblockMember = message.mentions.members.first();

  const botOutputChannel = message.guild.channels.cache.find(
    (channel) => channel.name === ChatNames.BOT_OUTPUT.toString()
  ) as TextChannel;

  if (!hasRole(unblockMember, "Time Out")) return;

  unblockMember.roles.remove("Time Out");

  try {
    await prisma.timedOutUsers.delete({
      where: { userId: unblockMember.id },
    });
    await message.react("👍");
  } catch (e) {
    if (e) {
      if (!unblockMember) {
        message.reply("Please make sure to mention the user in mind!");
        return;
      }
      botOutputChannel.send(
        `I could not remove <@${unblockMember.id}> from the DB, please contact a @Developer`
      );
      await message.react("👎");
    }
  }
};
