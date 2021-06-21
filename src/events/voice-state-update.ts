import { VoiceState } from "discord.js";
import { VoiceOnDemandTools } from "../programs";

const voiceStateUpdate = async (oldState: VoiceState, newState: VoiceState) => {
  await VoiceOnDemandTools.voiceOnDemandPermissions(oldState, newState);
  await VoiceOnDemandTools.voiceOnDemandReset(oldState, newState);
};

export default voiceStateUpdate;
