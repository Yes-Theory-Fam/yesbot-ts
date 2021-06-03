import { GuildMember, PartialGuildMember, Guild, Message } from "discord.js";
import Tools from "../common/tools";
import { createYesBotLogger } from "../log";

const logger = createYesBotLogger("programs", "Unassigned");

const getUnassignedRole = (guild: Guild) =>
  Tools.getRoleByName("Unassigned", guild);

let assignRoleOnJoin = true;

export const getStatus = (prefix: string) => {
  return `${prefix} set to ${
    assignRoleOnJoin ? "" : "*not* "
  }assign the Unassigned role.`;
};

export const UnassignedRoleAssignToggle = async (message: Message) => {
  assignRoleOnJoin = !assignRoleOnJoin;
  logger.info(
    `Set the bot to ${assignRoleOnJoin ? "" : "not "}assign Unassigned.`
  );
  await message.reply(getStatus("Now"));
};

export const UnassignedRoleAssignStatus = async (message: Message) => {
  await message.reply(
    getStatus("Currently") + " Use !unassignedRoleToggle to toggle this."
  );
};

export const UnassignedMemberJoin = (
  member: GuildMember | PartialGuildMember
) => {
  if (assignRoleOnJoin) {
    member.roles.add(getUnassignedRole(member.guild));
  }
};

export const UnassignedMemberUpdate = (
  newMember: GuildMember | PartialGuildMember
) => {
  const Unassigned = getUnassignedRole(newMember.guild);
  newMember.roles.remove(Unassigned);
};
