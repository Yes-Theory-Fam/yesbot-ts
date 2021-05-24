import {
  Client,
  GuildMember,
  PartialGuildMember,
  TextChannel,
  Guild,
  CategoryChannel,
  Permissions,
  GuildChannel,
} from "discord.js";
import Tools from "../common/tools";
import { Separators, NitroColors } from "../programs";
import prisma from "../prisma";
import moderator from "../common/moderator";

class GuildMemberUpdate {
  client: Client;

  constructor(
    oldMember: GuildMember | PartialGuildMember,
    newMember: GuildMember | PartialGuildMember
  ) {
    const regionCountries = ["Australia", "Canada", "the UK", "the USA"];
    const findGeneralRole = (member: GuildMember | PartialGuildMember) =>
      member.roles.cache.find(({ name }) => {
        return regionCountries.some((country) => name.endsWith(`${country}!`));
      });
    const hasSpecificRole = (member: GuildMember | PartialGuildMember) =>
      member.roles.cache.some(({ name }) => {
        return regionCountries.some((country) =>
          name.includes(`${country}! (`)
        );
      });

    const generalRole = findGeneralRole(oldMember);
    if (generalRole && hasSpecificRole(newMember)) {
      newMember.roles.remove(generalRole);
    }

    if (
      gainedRole(oldMember, newMember, "Time Out") ||
      gainedRole(oldMember, newMember, "Break")
    ) {
      revokePerUserPermissions(newMember);
    }

    if (resolvePerUserCondition(oldMember, newMember)) {
      resolvePerUserPermissions(newMember);
    }

    if (gainedRole(oldMember, newMember, "Break")) {
      lockCountryChannels(newMember);
    }

    if (lostRole(oldMember, newMember, "Break")) {
      unlockCountryChannels(newMember);
    }

    if (gainedRole(oldMember, newMember, "Unassigned")) return;

    NitroColors.removeColorIfNotAllowed(newMember);
    Separators.separatorOnRoleAdd(oldMember, newMember);
    Separators.separatorOnRoleRemove(oldMember, newMember);
  }
}

// A users per-user permissions shall be restored if they have lost one of the switch roles and every role they have is none of the switchRoles
const resolvePerUserCondition = (
  oldMember: GuildMember | PartialGuildMember,
  newMember: GuildMember | PartialGuildMember
): boolean => {
  const switchRoles = ["Time Out", "Break"];

  const lostRevokeRole = switchRoles.some((role) =>
    lostRole(oldMember, newMember, role)
  );
  if (!lostRevokeRole) {
    return false;
  }

  return newMember.roles.cache.every(
    (role) => !switchRoles.includes(role.name)
  );
};

const gainedRole = (
  oldMember: GuildMember | PartialGuildMember,
  newMember: GuildMember | PartialGuildMember,
  roleName: string
) =>
  !moderator.hasRole(oldMember, roleName) &&
  moderator.hasRole(newMember, roleName);

const lostRole = (
  oldMember: GuildMember | PartialGuildMember,
  newMember: GuildMember | PartialGuildMember,
  roleName: string
) =>
  moderator.hasRole(oldMember, roleName) &&
  !moderator.hasRole(newMember, roleName);

const revokePerUserPermissions = async (
  newMember: GuildMember | PartialGuildMember
) => {
  const guild = newMember.guild;
  const perUserChannelIds = await prisma.channelToggle.findMany({
    select: { channel: true },
  });
  const targetChannels = perUserChannelIds
    .map((toggle) => toggle.channel)
    .map((id) => guild.channels.resolve(id))
    .filter((x) => x); // This filter is mainly to help in development because bots might have channels of multiple servers in their db

  targetChannels.forEach((channel) =>
    channel.permissionOverwrites.get(newMember.id)?.delete()
  );
};

type ChannelAccessToggleMessages = {
  [key: string]: { channelId: string; toggles: string[] };
};

const getChannelAccessToggleMessages =
  async (): Promise<ChannelAccessToggleMessages> => {
    const toggles = await prisma.channelToggle.findMany({
      select: { message: true, emoji: true },
    });

    const messageToggleList: {
      [key: string]: { channelId: string; toggles: string[] };
    } = {};
    for (const toggle of toggles) {
      const messageId = toggle.message.id;
      if (messageToggleList[messageId]) {
        messageToggleList[messageId].toggles.push(toggle.emoji);
        continue;
      }

      messageToggleList[messageId] = {
        channelId: toggle.message.channel,
        toggles: [toggle.emoji],
      };
    }

    return messageToggleList;
  };

const resolvePerUserPermissions = async (
  newMember: GuildMember | PartialGuildMember
) => {
  const after = (BigInt(newMember.id) - BigInt(5)).toString();

  const messageToggleList = await getChannelAccessToggleMessages();
  for (const messageId in messageToggleList) {
    const { channelId, toggles } = messageToggleList[messageId];
    const channel = newMember.guild.channels.resolve(channelId);
    if (!channel || !(channel instanceof TextChannel)) continue;

    const message = await channel.messages.fetch(messageId);

    const relevantReactions = message.reactions.cache.filter((reaction) =>
      toggles.includes(reaction.emoji.name)
    );

    for (const [_, reaction] of relevantReactions) {
      const users = await reaction.users.fetch({
        after,
        limit: 10,
      });
      if (!users.has(newMember.id)) continue;

      Tools.addPerUserPermissions(
        reaction.emoji.name,
        messageId,
        newMember.guild,
        newMember
      );
    }
  }
};

const getCountryChannels = (guild: Guild) => {
  const countryCategories = [
    "africa",
    "north america",
    "asia",
    "europe",
    "south america",
    "oceania",
  ];

  const countryCategoryChannels = guild.channels.cache.filter(
    (channel) =>
      channel instanceof CategoryChannel &&
      countryCategories.some((category: string) =>
        channel.name.toLowerCase().endsWith(category)
      )
  );

  return countryCategoryChannels
    .array()
    .map((category) => (category as CategoryChannel).children.array())
    .flat();
};

const lockCountryChannels = (member: GuildMember | PartialGuildMember) => {
  const hasReadPermissions = (channel: GuildChannel) =>
    channel.permissionsFor(member.id).has(Permissions.FLAGS.VIEW_CHANNEL);

  getCountryChannels(member.guild)
    .filter(hasReadPermissions)
    .forEach((channel) =>
      channel.updateOverwrite(member.id, {
        VIEW_CHANNEL: false,
      })
    );
};

const unlockCountryChannels = (member: GuildMember | PartialGuildMember) => {
  getCountryChannels(member.guild).forEach((channel) =>
    channel.permissionOverwrites.get(member.id)?.delete()
  );
};

export default GuildMemberUpdate;
