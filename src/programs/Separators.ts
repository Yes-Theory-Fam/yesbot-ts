import { GuildMember, PartialGuildMember } from "discord.js";

const separatorStart = "\u2063";

export const separatorOnRoleAdd = (
  oldMember: GuildMember | PartialGuildMember,
  newMember: GuildMember | PartialGuildMember
) => {
  // No role added
  if (oldMember.roles.cache.size >= newMember.roles.cache.size) return;
  const addedRole = newMember.roles.cache
    .filter(
      (role) => !oldMember.roles.cache.some((oldRole) => oldRole.id === role.id)
    )
    .first();

  if (addedRole.name.startsWith(separatorStart)) return;
  const { guild } = oldMember;

  const separators = guild.roles.cache
    .filter(({ name }) => name.startsWith(separatorStart))
    .array();

  // We can find the matching separator by sorting the array of the separators and the added role.
  //   The separator above the added role is the correct one. If there is none, no separator is added.
  const sorted = [...separators, addedRole].sort((a, b) =>
    b.comparePositionTo(a)
  );
  const addedIndex = sorted.indexOf(addedRole);
  const separatorIndex = addedIndex - 1;

  if (separatorIndex < 0) return;

  newMember.roles.add(sorted[separatorIndex]);
};

export const separatorOnRoleRemove = (
  oldMember: GuildMember | PartialGuildMember,
  newMember: GuildMember | PartialGuildMember
) => {
  if (oldMember.roles.cache.size <= newMember.roles.cache.size) return;

  const memberRolesSorted = newMember.roles.cache
    .array()
    .sort((a, b) => b.comparePositionTo(a));

  // A separator role can be removed if there is no role or another separator role below it.
  const separatorsToRemove = memberRolesSorted.filter(
    (role, index) =>
      role.name.startsWith(separatorStart) &&
      (index === memberRolesSorted.length - 2 ||
        memberRolesSorted[index + 1]?.name.startsWith(separatorStart))
  );

  separatorsToRemove.forEach((role) => newMember.roles.remove(role));
};
