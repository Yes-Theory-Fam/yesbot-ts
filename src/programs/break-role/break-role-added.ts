import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../event-distribution";
import {
  GuildChannel,
  GuildMember,
  PartialGuildMember,
  PermissionsBitField,
} from "discord.js";
import prisma from "../../prisma";
import { getRoleAccessedChannels } from "./common";
import Tools from "../../common/tools";

@Command({
  event: DiscordEvent.GUILD_MEMBER_UPDATE,
  roleNamesAdded: ["Break"],
})
class BreakRoleAdded extends CommandHandler<DiscordEvent.GUILD_MEMBER_UPDATE> {
  async handle(_: GuildMember, newMember: GuildMember): Promise<void> {
    await this.revokePerUserPermissions(newMember);
    await this.lockRoleChannels(newMember);

    const memberRole = Tools.getRoleByName("Member", newMember.guild);
    if (memberRole) {
      await newMember.roles.remove(memberRole);
    }
  }

  private async revokePerUserPermissions(member: GuildMember) {
    const guild = member.guild;
    const perUserChannels = await prisma.channelToggle.findMany({
      select: { channel: true },
    });

    const targetChannels = perUserChannels
      .map((toggle) => toggle.channel)
      .map((id) => guild.channels.resolve(id))
      .filter((x) => x); // This filter is mainly to help in development because bots might have channels of multiple servers in their db

    const deletePromises = targetChannels.map((channel) =>
      (channel as GuildChannel).permissionOverwrites
        .resolve(member.id)
        ?.delete()
    );

    await Promise.all(deletePromises);
  }

  private async lockRoleChannels(member: GuildMember) {
    const hasReadPermissions = (channel: GuildChannel) =>
      channel
        .permissionsFor(member.id)
        ?.has(PermissionsBitField.Flags.ViewChannel) ?? false;

    const editPromises = getRoleAccessedChannels(member.guild)
      .filter(hasReadPermissions)
      .map((channel) =>
        channel.permissionOverwrites.edit(member.id, {
          ViewChannel: false,
        })
      );

    await Promise.all(editPromises);
  }
}
