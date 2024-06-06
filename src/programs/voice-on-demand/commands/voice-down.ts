import { ChatInputCommandInteraction } from "discord.js";
import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../../event-distribution/index.js";
import {
  editErrors,
  ensureHasYesTheory,
  minMembers,
  permissionErrors,
} from "../common.js";
import { VoiceOnDemandService } from "../voice-on-demand-service.js";

@Command({
  event: DiscordEvent.SLASH_COMMAND,
  root: "voice",
  subCommand: "down",
  description: "Decrement the user-limit of your room",
  errors: {
    ...editErrors,
    ...permissionErrors,
  },
})
class VoiceDown extends CommandHandler<DiscordEvent.SLASH_COMMAND> {
  async handle(interaction: ChatInputCommandInteraction): Promise<void> {
    ensureHasYesTheory(interaction);

    const voiceOnDemandService = new VoiceOnDemandService();
    await voiceOnDemandService.updateLimit(interaction, (channel) => {
      return Math.max(minMembers, channel.userLimit - 1);
    });
  }
}
