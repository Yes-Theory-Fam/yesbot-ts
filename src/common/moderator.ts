import {
  GuildMember,
  Message,
  PartialGuildMember,
  TextChannel,
} from "discord.js";
import { Bot } from "../bot";

const isAuthorModerator = (message: Message): boolean => {
  if (message.member.roles.hoist) {
    return message.member.roles.hoist.name === process.env.MODERATOR_ROLE_NAME;
  } else {
    return false;
  }
};

const hasRole = (
  member: GuildMember | PartialGuildMember,
  roleName: string
): boolean => {
  return !!member.roles.cache.find((r) => r.name === roleName);
};

export const isRegistered = (
  member: GuildMember | PartialGuildMember
): boolean => {
  return !!member.roles.cache.find((role) => role.name.startsWith("I'm from "));
};

const textLog = (text: string): Promise<Message> => {
  const bot = Bot.getInstance();
  const client = bot.getClient();
  const outputChannel = <TextChannel>(
    client.channels.resolve(process.env.OUTPUT_CHANNEL_ID)
  );
  return outputChannel.send(text);
};

const getMember = (userId: string): GuildMember => {
  return Bot.getInstance()
    .getClient()
    .guilds.resolve(process.env.GUILD_ID)
    .members.resolve(userId);
};
export default { textLog, getMember, isAuthorModerator, hasRole, isRegistered };
// module.exports = { textLog, getMember, isAuthorModerator, hasRole, isRegistered };
