import Discord, {
  GuildMember,
  TextChannel,
  PartialGuildMember,
} from "discord.js";
import bot from "../index";
import { BuddyProjectSignup } from "../programs/BuddyProject";

class MemberJoin {
  bot: Discord.Client;

  constructor(member: GuildMember | PartialGuildMember) {
    if (member.roles.cache.find((r) => r.name === "Buddy Project 2020")) {
      const bpOutputChannel = <TextChannel>member.guild.channels.cache.find(c => c.name === "buddy-project-output");
      BuddyProjectSignup(member as GuildMember).then(output => bpOutputChannel.send(output));
    }
  }
}

export default MemberJoin;
