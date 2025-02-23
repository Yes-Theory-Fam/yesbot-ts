import {
  GuildMember,
  Message,
  EmbedBuilder,
  PartialGuildMember,
  TextChannel,
  BaseInteraction,
} from "discord.js";
import Tools from "./tools.js";

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

export const textLog = async (
  text: string | EmbedBuilder
): Promise<Message> => {
  const bot = await import("../index.js").then((m) => m.default);
  const outputChannel = <TextChannel>(
    bot.channels.resolve(process.env.OUTPUT_CHANNEL_ID)
  );

  return typeof text === "string"
    ? await outputChannel.send(text)
    : await outputChannel.send({ embeds: [text] });
};

export const getMember = async (
  userId: string
): Promise<GuildMember | null> => {
  const bot = await import("../index.js").then((m) => m.default);

  return (
    bot.guilds.resolve(process.env.GUILD_ID)?.members.resolve(userId) ?? null
  );
};
