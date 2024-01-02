import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../../event-distribution";
import { ChatInputCommandInteraction, TextChannel } from "discord.js";
import { ChatNames } from "../../../collections/chat-names";
import Tools from "../../../common/tools";
import { buddyProjectRoleName } from "../constants";

@Command({
  event: DiscordEvent.SLASH_COMMAND,
  root: "buddy-project-mod",
  subCommand: "unlock",
  description: "Make BP channels visible, unleashing chaos on them",
})
class UnlockBuddyProject extends CommandHandler<DiscordEvent.SLASH_COMMAND> {
  async handle(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply({ ephemeral: true });

    const guild = interaction.guild;
    if (!guild) return;

    const bpRole = Tools.getRoleByName(buddyProjectRoleName, guild);
    if (!bpRole) throw new Error(`Could not find ${buddyProjectRoleName}`);

    const memberRole = Tools.getRoleByName("Member", guild);
    if (!memberRole) throw new Error(`Could not find Member`);

    const bp = guild.channels.cache.find(
      (c) =>
        c.name === ChatNames.BUDDY_PROJECT &&
        c.parent?.name.toLowerCase().endsWith("events")
    ) as TextChannel;
    const bpInfo = guild.channels.cache.find(
      (c) => c.name === ChatNames.BUDDY_PROJECT_INFO
    ) as TextChannel;
    const bpDmsDisabled = guild.channels.cache.find(
      (c) => c.name === ChatNames.BUDDY_PROJECT_DMS_DISABLED
    ) as TextChannel;

    await bp.permissionOverwrites.edit(bpRole, {
      ViewChannel: true,
      SendMessages: true,
    });

    await bpInfo.permissionOverwrites.delete(memberRole);
    await bpInfo.permissionOverwrites.edit(guild.roles.everyone, {
      ViewChannel: true,
    });

    await bpDmsDisabled.permissionOverwrites.edit(bpRole, {
      ViewChannel: true,
    });

    await interaction.editReply("Updated permissions, all channels unlocked");
  }
}
