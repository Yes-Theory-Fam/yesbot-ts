import { VoiceState } from "discord.js";
import Tools from "../common/tools";
import { Command, CommandHandler, DiscordEvent } from "../event-distribution";
import { VoiceStateChange } from "../event-distribution/events/voice-state-update";
import { isProdVoiceChannel, revertProductivityPermissions } from "./common";

@Command({
  event: DiscordEvent.VOICE_STATE_UPDATE,
  changes: [VoiceStateChange.LEFT],
  description:
    "This handler checks if the user left one of the productivity channels",
})
class RemoveBreakRoleOnLeave
  implements CommandHandler<DiscordEvent.VOICE_STATE_UPDATE>
{
  async handle(oldState: VoiceState, newState: VoiceState): Promise<void> {
    const channel = oldState.channel;

    if (!isProdVoiceChannel(channel)) return;

    const guildMember = oldState.member;
    await revertProductivityPermissions(guildMember, channel);

    const breakRole = Tools.getRoleByName("Break", oldState.guild);
    await guildMember.roles.remove(breakRole);
  }
}
