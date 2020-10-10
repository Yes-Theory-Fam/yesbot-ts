import {
  Client,
  GuildMember,
  TextChannel,
  PartialGuildMember,
} from "discord.js";
import { BuddyProject, Unassigned } from "../programs";

class MemberJoin {
  bot: Client;

  constructor(member: GuildMember | PartialGuildMember) {
    Unassigned.UnassignedMemberJoin(member);
    if (member.roles.cache.find((r) => r.name === "Buddy Project 2020")) {
      const bpOutputChannel = <TextChannel>(
        member.guild.channels.cache.find(
          (c) => c.name === "buddy-project-output"
        )
      );
      BuddyProject.BuddyProjectSignup(member as GuildMember).then((output) =>
        bpOutputChannel.send(output)
      );
    }
  }
}

export default MemberJoin;
