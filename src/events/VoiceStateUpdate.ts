import { VoiceState } from "discord.js";
import { Valentine, VoiceOnDemandTools } from "../programs";

class VoiceStateUpdate {
  constructor(oldState: VoiceState, newState: VoiceState) {
    Valentine.valentineVoiceState(oldState, newState);
    VoiceOnDemandTools.voiceOnDemandPermissions(oldState, newState);
    VoiceOnDemandTools.voiceOnDemandReset(oldState, newState);
  }
}

export default VoiceStateUpdate;
