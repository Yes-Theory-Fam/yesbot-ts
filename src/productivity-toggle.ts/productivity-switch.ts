import { VoiceState } from "discord.js";
import { Command, CommandHandler, DiscordEvent } from "../event-distribution";
import { VoiceStateChange } from "../event-distribution/events/voice-state-update";
import { isProdVoiceChannel, revertProductivityPermissions } from "./common";

@Command({
  event: DiscordEvent.VOICE_STATE_UPDATE,
  changes: [VoiceStateChange.SWITCHED_CHANNEL],
  description:
    "This handler checks if the user switched between productivity channels or to a different channel",
})
class ChannelSwitchCheck
  implements CommandHandler<DiscordEvent.VOICE_STATE_UPDATE>
{
  async handle(oldState: VoiceState, newState: VoiceState): Promise<void> {
    const oldChannel = oldState.channel;
    const newChannel = newState.channel;

    if (isProdVoiceChannel(oldChannel) && !isProdVoiceChannel(newChannel)) {
      const guildMember = newState.member;

      await revertProductivityPermissions(guildMember, oldChannel);
    }
  }
}
