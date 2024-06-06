import { ChatInputCommandInteraction } from "discord.js";
import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../../event-distribution/index.js";
import {
  editErrors,
  ensureHasYesTheory,
  maxMembers,
  permissionErrors,
} from "../common.js";
import { VoiceOnDemandService } from "../voice-on-demand-service.js";

@Command({
  event: DiscordEvent.SLASH_COMMAND,
  root: "voice",
  subCommand: "up",
  description: "Increment the user-limit of your room",
  errors: {
    ...editErrors,
    ...permissionErrors,
  },
})
class VoiceUp extends CommandHandler<DiscordEvent.SLASH_COMMAND> {
  async handle(interaction: ChatInputCommandInteraction): Promise<void> {
    ensureHasYesTheory(interaction);

    const voiceOnDemandService = new VoiceOnDemandService();
    await voiceOnDemandService.updateLimit(interaction, (channel) => {
      return Math.min(maxMembers, channel.userLimit + 1);
    });
  }
}
