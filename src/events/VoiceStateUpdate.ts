import { VoiceState } from "discord.js";
import { voiceOnDemandReset } from "../programs/VoiceOnDemand";

class VoiceStateUpdate {
  constructor(oldState: VoiceState, newState: VoiceState) {
    voiceOnDemandReset(oldState, newState);
  }
}

export default VoiceStateUpdate;
