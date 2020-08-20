import {
  CategoryChannel,
  Client,
  GuildChannel,
  GuildMember,
  PartialGuildMember,
  Role,
  TextChannel,
} from "discord.js";
import Tools from "../common/tools";
import { hasRole } from "../common/moderator";
import { Separators } from "../programs";

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
    const nitroRoles = [
      "636670666447388702",
      "636525712450256896",
      "636902084108615690",
      "636483478640132106",
      "636901944790876160",
    ];
    const nitroColor: Role = newMember.roles.cache.find((r) =>
      nitroRoles.includes(r.id)
    );
    if (nitroColor && !hasRole(newMember, "Nitro Booster")) {
      newMember.roles.remove(nitroColor);
    }

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
  const selectionMessages = selectionChannels.map(
    (channel: TextChannel) => channel.messages.cache.array()[0]
  );
  for (let i = 0; i < selectionMessages.length; i++) {
    const reactions = selectionMessages[i].reactions.cache;
    reactions
      .filter((reaction) => !!reaction.users.resolve(newMember.id))
      .forEach((reaction) =>
        Tools.addPerUserPermissions(
          reaction.emoji.name,
          selectionMessages[i].id,
          newMember.guild,
          newMember
        )
      );
  }
};

export default GuildMemberUpdate;
