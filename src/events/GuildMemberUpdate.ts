import {
  CategoryChannel,
  Client,
  GuildChannel,
  GuildMember,
  PartialGuildMember,
  TextChannel,
} from "discord.js";
import Tools from "../common/tools";
import { hasRole } from "../common/moderator";
import { Separators, NitroColors } from "../programs";
import { Logger } from "../common/Logger";

class GuildMemberUpdate {
  bot: Client;

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

    if (!hasRole(oldMember, "Time Out") && hasRole(newMember, "Time Out")) {
      revokePerUserPermissions(newMember);
    }

    if (hasRole(oldMember, "Time Out") && !hasRole(newMember, "Time Out")) {
      resolvePerUserPermissions(newMember);
    }

    NitroColors.removeColorIfNotAllowed(newMember);
    Separators.seperatorOnRoleAdd(oldMember, newMember);
    Separators.seperatorOnRoleRemove(oldMember, newMember);
  }
}

const revokePerUserPermissions = async (
  newMember: GuildMember | PartialGuildMember
) => {
  const isCategory = (channel: GuildChannel): channel is CategoryChannel =>
    !!(channel as CategoryChannel).children;
  const perUserCategories = ["learning languages", "hobbies", "gaming"];
  const categoryChannels = newMember.guild.channels.cache
    .array()
    .filter(isCategory);
  const perUserCategoryChannels = categoryChannels.filter((channel) =>
    perUserCategories.some((name) => channel.name.toLowerCase().endsWith(name))
  );
  for (let i = 0; i < perUserCategoryChannels.length; i++) {
    const category = perUserCategoryChannels[i];
    const channels = category.children;
    channels.forEach((channel) =>
      channel.permissionOverwrites.get(newMember.id)?.delete()
    );
  }
};

const resolvePerUserPermissions = async (
  newMember: GuildMember | PartialGuildMember
) => {
  const isText = (channel: GuildChannel): channel is TextChannel =>
    !!(channel as TextChannel).messages;
  const listChannels = [
    "list-of-languages",
    "list-of-games",
    "list-of-hobbies",
  ];
  const selectionChannels = newMember.guild.channels.cache
    .array()
    .filter(isText)
    .filter((channel) => listChannels.some((name) => channel.name === name));

  try {
    await Promise.all(
      selectionChannels.map((channel) =>
        channel.messages.fetch({ limit: 1 }, true)
      )
    );
  } catch (err) {
    Logger("GuildMemberUpdate", "resolveUserPermissions", err);
  }

  const selectionMessages = selectionChannels.map(
    (channel: TextChannel) => channel.messages.cache.array()[0]
  );

  for (let i = 0; i < selectionMessages.length; i++) {
    const reactions = selectionMessages[i].reactions.cache;

    for (const [_, reaction] of reactions) {
      const users = await reaction.users.fetch();
      if (!users.has(newMember.id)) continue;

      Tools.addPerUserPermissions(
        reaction.emoji.name,
        selectionMessages[i].id,
        newMember.guild,
        newMember
      );
    }
  }
};

export default GuildMemberUpdate;
