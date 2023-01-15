import {
  Client,
  GuildMember,
  Message,
  EmbedBuilder,
  PartialGuildMember,
  TextChannel,
  APIInteractionGuildMember,
  BaseInteraction,
} from "discord.js";
import Tools from "./tools";

export const isAuthorModerator = (interaction: BaseInteraction): boolean => {
  const member = interaction.member;
  const guild = interaction.guild;

  if (!member || !guild) return false;

  const modRoleName = process.env.MODERATOR_ROLE_NAME;

  if (Array.isArray(member.roles)) {
    const modRole = Tools.getRoleByName(modRoleName, interaction.guild)!;
    return member.roles.includes(modRole.id);
  }

  return member?.roles.hoist?.name === modRoleName;
};

export const hasRole = (
  member: GuildMember | PartialGuildMember,
  roleName: string
): boolean => {
  return member.roles.cache.some((r) => r.name === roleName);
};

export const isRegistered = (
  member: GuildMember | PartialGuildMember
): boolean => {
  return member.roles.cache.some(
    (role) => role.id === process.env.MEMBER_ROLE_ID
  );
};

export const textLog = (text: string | EmbedBuilder): Promise<Message> => {
  const bot = require("..") as Client;
  const outputChannel = <TextChannel>(
    bot.channels.resolve(process.env.OUTPUT_CHANNEL_ID)
  );

  return typeof text === "string"
    ? outputChannel.send(text)
    : outputChannel.send({ embeds: [text] });
};

export const getMember = (userId: string): GuildMember | null => {
  const bot = require("..") as Client;
  return (
    bot.guilds.resolve(process.env.GUILD_ID)?.members.resolve(userId) ?? null
  );
};
