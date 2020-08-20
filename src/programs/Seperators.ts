import { GuildMember, PartialGuildMember } from "discord.js";

const seperatorStart = "\u2063";

export const seperatorOnRoleAdd = (
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

  if (addedRole.name.startsWith(seperatorStart)) return;
  const { guild } = oldMember;

  const seperators = guild.roles.cache
    .filter(({ name }) => name.startsWith(seperatorStart))
    .array();

  // We can find the matching seperator by sorting the array of the seperators and the added role.
  //   The seperator above the added role is the correct one. If there is none, no seperator is added.
  const sorted = [...seperators, addedRole].sort((a, b) =>
    b.comparePositionTo(a)
  );
  const addedIndex = sorted.indexOf(addedRole);
  const seperatorIndex = addedIndex - 1;

  if (seperatorIndex < 0) return;

  newMember.roles.add(sorted[seperatorIndex]);
};

export const seperatorOnRoleRemove = (
  oldMember: GuildMember | PartialGuildMember,
  newMember: GuildMember | PartialGuildMember
) => {
  if (oldMember.roles.cache.size <= newMember.roles.cache.size) return;

  const memberRolesSorted = newMember.roles.cache
    .array()
    .sort((a, b) => b.comparePositionTo(a));

  // A seperator role can be removed if there is no role or another seperator role below it.
  const seperatorsToRemove = memberRolesSorted.filter(
    (role, index) =>
      role.name.startsWith(seperatorStart) &&
      (index === memberRolesSorted.length - 2 ||
        memberRolesSorted[index + 1]?.name.startsWith(seperatorStart))
  );

  seperatorsToRemove.forEach((role) => newMember.roles.remove(role));
};
