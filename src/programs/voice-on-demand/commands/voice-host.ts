import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  VoiceChannel,
} from "discord.js";
import { hasRole } from "../../../common/moderator.js";
import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../../event-distribution/index.js";
import {
  editErrors,
  ensureHasYesTheory,
  permissionErrors,
  VoiceOnDemandErrors,
} from "../common.js";
import { VoiceOnDemandService } from "../voice-on-demand-service.js";

enum Errors {
  OWNER_IS_YOURSELF = "OWNER_IS_YOURSELF",
  NOT_IN_YOUR_VC = "NOT_IN_YOUR_VC",
  NEW_HOST_MISSING_YES_THEORY_ROLE = "NEW_HOST_MISSING_YES_THEORY_ROLE",
}

@Command({
  event: DiscordEvent.SLASH_COMMAND,
  root: "voice",
  subCommand: "host",
  description: "Pass your room to someone else",
  options: [
    {
      name: "user",
      type: ApplicationCommandOptionType.User,
      description: "The new host of your room",
      required: true,
    },
  ],
  errors: {
    ...editErrors,
    ...permissionErrors,
    [Errors.OWNER_IS_YOURSELF]: "Errrrr... That's yourself 🤨",
    [Errors.NOT_IN_YOUR_VC]: "That user is not in your voice channel",
    [VoiceOnDemandErrors.ALREADY_HAS_ROOM]:
      "This user already has a voice channel",
    [Errors.NEW_HOST_MISSING_YES_THEORY_ROLE]:
      "That user doesn't have the Yes Theory role required to control the room. Pick someone else or get a Support to give them the Yes Theory role.",
  },
})
class VoiceHost extends CommandHandler<DiscordEvent.SLASH_COMMAND> {
  private readonly vodService = new VoiceOnDemandService();

  async handle(interaction: ChatInputCommandInteraction): Promise<void> {
    ensureHasYesTheory(interaction);

    await interaction.deferReply({ ephemeral: true });

    const userId = interaction.user.id;
    const mapping = await this.vodService.mappingByUserId(userId);

    if (!mapping) throw new Error(VoiceOnDemandErrors.HAS_NO_ROOM);

    const newOwner = interaction.options.getUser("user")!;
    if (newOwner.id === userId) throw new Error(Errors.OWNER_IS_YOURSELF);

    const newOwnerMapping = await this.vodService.mappingByUserId(newOwner.id);
    if (newOwnerMapping) throw new Error(VoiceOnDemandErrors.ALREADY_HAS_ROOM);

    const guild = interaction.guild!;
    const channel = guild.channels.resolve(mapping.channelId) as VoiceChannel;
    const isInVc = channel.members.has(newOwner.id);
    if (!isInVc) throw new Error(Errors.NOT_IN_YOUR_VC);

    const newOwnerMember = await guild.members.fetch(newOwner.id);
    const hasYesTheory = hasRole(newOwnerMember, "Yes Theory");
    if (!hasYesTheory) throw new Error(Errors.NEW_HOST_MISSING_YES_THEORY_ROLE);

    const response = await this.vodService.transferRoomOwnership(
      newOwnerMember,
      channel,
      mapping.emoji
    );

    await interaction.editReply(response);
  }
}
