import { Guild, Role } from "discord.js";

const roleName = `Buddy Project ${new Date().getFullYear()}`;
const roleColor = `#2041e6`;

export const createBuddyProjectRole = async (guild: Guild): Promise<Role> => {
  const existing = guild.roles.cache.find((r) => r.name === roleName);
  if (existing) return existing;

  const pioneerRole = guild.roles.cache.find((r) =>
    r.name.toLowerCase().startsWith("pioneer")
  );

  if (!pioneerRole) {
    throw new Error("Failed to find Pioneer role as position reference");
  }

  const bpPosition = pioneerRole.position;

  return await guild.roles.create({
    name: roleName,
    color: roleColor,
    mentionable: false,
    reason: "BP Bootstrap",
    position: bpPosition,
  });
};
