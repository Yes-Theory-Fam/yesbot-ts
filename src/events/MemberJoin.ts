import { Client, GuildMember, PartialGuildMember } from "discord.js";
import { Unassigned } from "../programs";

class MemberJoin {
  bot: Client;

  constructor(member: GuildMember | PartialGuildMember) {
    Unassigned.UnassignedMemberJoin(member);
  }
}

export default MemberJoin;
