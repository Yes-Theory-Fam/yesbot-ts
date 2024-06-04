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
  minMembers,
  permissionErrors,
} from "../common.js";
import { VoiceOnDemandService } from "../voice-on-demand-service.js";

@Command({
  event: DiscordEvent.SLASH_COMMAND,
  root: "voice",
  subCommand: "shrink",
  description:
    "Set the user-limit of your room to the number of currently present members",
  errors: {
    ...editErrors,
    ...permissionErrors,
  },
})
class VoiceShrink extends CommandHandler<DiscordEvent.SLASH_COMMAND> {
  async handle(interaction: ChatInputCommandInteraction): Promise<void> {
    ensureHasYesTheory(interaction);

    const voiceOnDemandService = new VoiceOnDemandService();
    await voiceOnDemandService.updateLimit(interaction, (channel) => {
      const clampedLower = Math.max(minMembers, channel.members.size);

      return Math.min(clampedLower, maxMembers);
    });
  }
}
