import { VoiceState } from "discord.js";
import { getVoiceChannel } from "../programs/VoiceOnDemand";

class VoiceStateUpdate {
  constructor(oldState: VoiceState, newState: VoiceState) {
    const { member, guild } = newState;
    const leftPrivateChannel =
      oldState.channel === getVoiceChannel(guild, member) &&
      newState.channel == null;
    if (leftPrivateChannel) oldState.channel.delete();
  }
}

export default VoiceStateUpdate;
