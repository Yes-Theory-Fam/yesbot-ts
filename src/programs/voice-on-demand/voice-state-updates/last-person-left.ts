import { VoiceState } from "discord.js";
import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../../event-distribution/index.js";
import { VoiceStateChange } from "../../../event-distribution/events/voice-state-update.js";
import { VoiceOnDemandService } from "../voice-on-demand-service.js";

@Command({
  event: DiscordEvent.VOICE_STATE_UPDATE,
  changes: [VoiceStateChange.LEFT, VoiceStateChange.SWITCHED_CHANNEL],
})
class VoiceLastPersonLeft extends CommandHandler<DiscordEvent.VOICE_STATE_UPDATE> {
  private readonly vodService = new VoiceOnDemandService();

  async handle(before: VoiceState, after: VoiceState): Promise<void> {
    const leftChannel = before.channel!;
    const leftId = leftChannel.id;

    if (leftChannel.members.size > 0) return;

    const mapping = await this.vodService.mappingByChannelId(leftId);
    if (!mapping) return;

    await this.vodService.resetDeleteIfEmptyTimer(leftId);
  }
}
