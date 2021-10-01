import { VoiceState } from "discord.js";
import { hasRole } from "../common/moderator";
import Tools from "../common/tools";
import { Command, CommandHandler, DiscordEvent } from "../event-distribution";
import { VoiceStateChange } from "../event-distribution/events/voice-state-update";
import { createProductivityPermissions, isProdVoiceChannel } from "./common";

@Command({
  event: DiscordEvent.VOICE_STATE_UPDATE,
  changes: [VoiceStateChange.JOINED, VoiceStateChange.SWITCHED_CHANNEL],
})
class AddBreakRoleOnJoin
  implements CommandHandler<DiscordEvent.VOICE_STATE_UPDATE>
{
  async handle(oldState: VoiceState, newState: VoiceState): Promise<void> {
    if (hasRole(newState.member, "Break")) return;

    const channel = newState.channel;

    if (!isProdVoiceChannel(channel)) return;

    const guildMember = newState.member;
    await createProductivityPermissions(guildMember, channel);

    const breakRole = Tools.getRoleByName("Break", newState.guild);
    await guildMember.roles.add(breakRole);
  }
}
