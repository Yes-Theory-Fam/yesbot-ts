import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
} from "discord.js";
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
  subCommand: "limit",
  description: "Update your room's user-limit",
  options: [
    {
      name: "limit",
      type: ApplicationCommandOptionType.Integer,
      min_value: minMembers,
      max_value: maxMembers,
      description: "The new user-limit for your room",
      required: true,
    },
  ],
  errors: {
    ...editErrors,
    ...permissionErrors,
  },
})
class VoiceLimit extends CommandHandler<DiscordEvent.SLASH_COMMAND> {
  async handle(interaction: ChatInputCommandInteraction): Promise<void> {
    ensureHasYesTheory(interaction);

    const newLimit = interaction.options.getInteger("limit")!;

    const voiceOnDemandService = new VoiceOnDemandService();
    await voiceOnDemandService.updateLimit(interaction, () => newLimit);
  }
}
