import { GuildMember, PartialGuildMember } from "discord.js";
import { Unassigned } from "../programs";

const memberJoin = (member: GuildMember | PartialGuildMember) => {
  Unassigned.UnassignedMemberJoin(member);
};

export default memberJoin;
