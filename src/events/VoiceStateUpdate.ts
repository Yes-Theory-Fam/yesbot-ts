import { VoiceState } from "discord.js";
import {
  voiceOnDemandReset,
  voiceOnDemandPermissions,
} from "../programs/VoiceOnDemand";

class VoiceStateUpdate {
  constructor(oldState: VoiceState, newState: VoiceState) {
    voiceOnDemandPermissions(oldState, newState);
    voiceOnDemandReset(oldState, newState);
  }
}

export default VoiceStateUpdate;
