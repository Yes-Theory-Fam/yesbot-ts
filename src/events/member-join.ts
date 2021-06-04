import { GuildMember, PartialGuildMember } from "discord.js";
import { Unassigned } from "../programs";

const memberJoin = (member: GuildMember | PartialGuildMember) => {
  Unassigned.unassignedMemberJoin(member);
};

export default memberJoin;
