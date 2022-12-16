import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChatInputCommandInteraction,
  ComponentType,
  Snowflake,
  VoiceChannel,
} from "discord.js";
import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../../event-distribution";
import { maxMembers, VoiceOnDemandErrors } from "../common";
import { voiceOnDemandAutocomplete } from "../voice-on-demand-autocomplete";
import { VoiceOnDemandService } from "../voice-on-demand-service";

enum Errors {
  ALREADY_IN_ROOM = "ALREADY_IN_ROOM",
  HAS_FREE_SPACE = "HAS_FREE_SPACE",
  IS_AT_MAX = "IS_AT_MAX",
}

@Command({
  event: DiscordEvent.SLASH_COMMAND,
  root: "voice",
  subCommand: "knock",
  description: "Knock on a room",
  options: [
    {
      name: "user",
      type: ApplicationCommandOptionType.String,
      description: "The user you want to join",
      autocomplete: voiceOnDemandAutocomplete,
      required: true,
    },
  ],
  errors: {
    [VoiceOnDemandErrors.HAS_NO_ROOM]: "That user doesn't have a channel!",
    [Errors.ALREADY_IN_ROOM]: "You just knocked from inside!",
    [Errors.HAS_FREE_SPACE]: "That channel has free space; you can just join!",
    [Errors.IS_AT_MAX]: "That channel is already at the maximum limit, sorry!",
  },
})
class VoiceKnock extends CommandHandler<DiscordEvent.SLASH_COMMAND> {
  private readonly vodService = new VoiceOnDemandService();

  async handle(interaction: ChatInputCommandInteraction): Promise<void> {
    const userId = interaction.user.id;
    const targetUserId = interaction.options.getString("user")!;

    const mapping = await this.vodService.mappingByUserId(targetUserId);
    if (!mapping) throw new Error(VoiceOnDemandErrors.HAS_NO_ROOM);

    const channel = interaction.guild!.channels.resolve(
      mapping.channelId
    ) as VoiceChannel;
    if (channel.members.has(userId)) throw new Error(Errors.ALREADY_IN_ROOM);

    if (channel.members.size < channel.userLimit) {
      throw new Error(Errors.HAS_FREE_SPACE);
    }

    if (channel.members.size === maxMembers) throw new Error(Errors.IS_AT_MAX);

    await interaction.deferReply({ ephemeral: true });
    const gotAccess = await this.requestAccess(targetUserId, channel, userId);

    await interaction.editReply(
      gotAccess
        ? "You were let in!"
        : `Sorry, but the room owner didn't respond.`
    );

    const newLimit = Math.min(
      maxMembers,
      Math.max(channel.members.size, channel.userLimit)
    );
    await channel.setUserLimit(newLimit);
  }

  private async requestAccess(
    targetUserId: Snowflake,
    channel: VoiceChannel,
    requestingUserId: Snowflake
  ): Promise<boolean> {
    const voiceGrantAccessButton = "voice-grant-access-button";
    const grantAccessButton = new ButtonBuilder({
      custom_id: voiceGrantAccessButton,
      style: ButtonStyle.Success,
      label: "Yes!",
    });

    const components = new ActionRowBuilder<ButtonBuilder>({
      components: [grantAccessButton],
    });

    const message = await channel.send({
      content: `<@${targetUserId}>, <@${requestingUserId}> wants to join your voice channel. Allow?`,
      components: [components],
    });

    const filter = (interaction: ButtonInteraction) =>
      interaction.customId === voiceGrantAccessButton &&
      interaction.user.id === targetUserId;

    try {
      const reaction = await message.awaitMessageComponent({
        componentType: ComponentType.Button,
        time: 60_000,
        filter,
        dispose: true,
      });
      await reaction.reply({ ephemeral: true, content: "Alright!" });
      return true;
    } catch {
      return false;
    }
  }
}
