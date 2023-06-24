import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../event-distribution";
import { GuildMember, TextChannel } from "discord.js";
import { getRoleAccessedChannels } from "./common";
import prisma from "../../prisma";
import Tools from "../../common/tools";

@Command({
  event: DiscordEvent.GUILD_MEMBER_UPDATE,
  roleNamesRemoved: ["Break"],
})
class BreakRoleRemoved extends CommandHandler<DiscordEvent.GUILD_MEMBER_UPDATE> {
  async handle(oldMember: GuildMember, newMember: GuildMember): Promise<void> {
    await this.resolvePerUserPermissions(newMember);
    await this.unlockRoleChannels(newMember);
  }

  private async resolvePerUserPermissions(member: GuildMember) {
    const after = (BigInt(member.id) - BigInt(5)).toString();
    const toggles = await prisma.channelToggle.findMany({
      select: { message: true, emoji: true },
    });

    for (const { message, emoji } of toggles) {
      if (!message?.channel) continue;

      const channel = await member.guild.channels.fetch(message.channel);
      if (!channel || !(channel instanceof TextChannel)) continue;

      const reactionMessage = await channel.messages.fetch(message.id);
      const reaction = reactionMessage.reactions.cache.find(
        (r) => r.emoji.name === emoji
      );
      if (!reaction) continue;

      const users = await reaction.users.fetch({ after, limit: 10 });
      if (!users.has(member.id) || !reaction.emoji.name) continue;

      await Tools.addPerUserPermissions(
        reaction.emoji.name,
        message.id,
        member
      );
    }
  }

  private async unlockRoleChannels(member: GuildMember) {
    const deletePromises = getRoleAccessedChannels(member.guild).map(
      (channel) => channel.permissionOverwrites.resolve(member.id)?.delete()
    );

    await Promise.all(deletePromises);
  }
}
