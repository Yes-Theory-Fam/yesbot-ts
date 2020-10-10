import { GuildMember, PartialGuildMember, Guild } from "discord.js";
import Tools from "../common/tools";

const getUnassignedRole = (guild: Guild) =>
  Tools.getRoleByName("Unassigned", guild);

export const UnassignedMemberJoin = (
  member: GuildMember | PartialGuildMember
) => {
  member.roles.add(getUnassignedRole(member.guild));
};

export const UnassignedMemberUpdate = (
  newMember: GuildMember | PartialGuildMember
) => {
  const Unassigned = getUnassignedRole(newMember.guild);
  newMember.roles.remove(Unassigned);
};
