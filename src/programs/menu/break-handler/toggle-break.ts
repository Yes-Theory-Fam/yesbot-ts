import { DMChannel, GuildMember } from "discord.js";
import { isOnBreak } from "../common";
import { addBreakRole } from "./add-break";
import { removeBreakRole } from "./remove-break";

export const breakToggle = async (
  member: GuildMember,
  dmChannel: DMChannel
) => {
  const userOnBreak = await isOnBreak(member.id);

  if (userOnBreak) {
    await removeBreakRole(member, userOnBreak, dmChannel);
    return;
  }

  await addBreakRole(member, dmChannel);
};
