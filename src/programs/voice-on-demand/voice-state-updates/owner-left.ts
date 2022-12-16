import { VoiceState } from "discord.js";
import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../../event-distribution";
import { VoiceStateChange } from "../../../event-distribution/events/voice-state-update";
import { VoiceOnDemandService } from "../voice-on-demand-service";

@Command({
  event: DiscordEvent.VOICE_STATE_UPDATE,
  changes: [VoiceStateChange.LEFT, VoiceStateChange.SWITCHED_CHANNEL],
})
class VoiceOwnerLeft extends CommandHandler<DiscordEvent.VOICE_STATE_UPDATE> {
  private readonly vodService = new VoiceOnDemandService();

  async handle(before: VoiceState, after: VoiceState): Promise<void> {
    const userId = before.id;

    const mapping = await this.vodService.mappingByUserId(userId);
    if (!mapping) return;

    await this.vodService.resetRequireNewOwnerTimer(mapping.channelId);
  }
}
