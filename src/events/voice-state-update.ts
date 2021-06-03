import { VoiceState } from "discord.js";
import { VoiceOnDemandTools } from "../programs";

class VoiceStateUpdate {
  constructor(oldState: VoiceState, newState: VoiceState) {
    VoiceOnDemandTools.voiceOnDemandPermissions(oldState, newState);
    VoiceOnDemandTools.voiceOnDemandReset(oldState, newState);
  }
}

export default VoiceStateUpdate;
