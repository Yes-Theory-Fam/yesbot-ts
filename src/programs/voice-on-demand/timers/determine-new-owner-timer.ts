import { Timer } from "@prisma/client";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChannelType,
  ComponentType,
  GuildMember,
  userMention,
  VoiceChannel,
} from "discord.js";
import { hasRole } from "../../../common/moderator";
import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../../event-distribution";
import bot from "../../../index";
import { VoiceOnDemandService } from "../voice-on-demand-service";

@Command({
  event: DiscordEvent.TIMER,
  handlerIdentifier: DetermineNewOwnerTimer.identifier,
})
export class DetermineNewOwnerTimer extends CommandHandler<DiscordEvent.TIMER> {
  static identifier = "voice-determine-new-owner-timer";
  private readonly vodService = new VoiceOnDemandService();

  async handle(timer: Timer): Promise<void> {
    const { channelId } = timer.data as { channelId: string };
    const guild = bot.guilds.resolve(process.env.GUILD_ID)!;

    const channel = await guild.channels.fetch(channelId);
    if (
      !channel ||
      channel.type !== ChannelType.GuildVoice ||
      channel.members.size === 0
    ) {
      return;
    }

    const mapping = await this.vodService.mappingByChannelId(channelId);
    if (!mapping) return;

    if (channel.members.has(mapping.userId)) return;

    const selfPickedOwner = await this.requestNewOwner(channel);
    const newOwner = selfPickedOwner ?? (await this.selectNewOwner(channel));

    if (!newOwner) {
      // TODO notify members about what just happened
      await this.vodService.deleteVodChannel(channel);
      return;
    }

    const response = await this.vodService.transferRoomOwnership(
      newOwner,
      channel,
      mapping.emoji
    );

    if (!selfPickedOwner) {
      await channel.send(response);
    }
  }

  private async requestNewOwner(
    channel: VoiceChannel
  ): Promise<GuildMember | null> {
    const getMemberIds = () => channel.members.map((m) => m.id);

    const requestMessageText = `Hey, the owner of your room left! I need one of you to claim ownership of the room in the next minute, otherwise I'll pick someone randomly. You can claim ownership by clicking the button below!`;
    const pingedMessage = `${getMemberIds()
      .map(userMention)
      .join(", ")} ${requestMessageText}`;

    const voiceClaimHostId = "voice-claim-host";
    const claimButton = new ButtonBuilder({
      label: "Gimme Host!",
      style: ButtonStyle.Success,
      customId: voiceClaimHostId,
    });
    const components = new ActionRowBuilder<ButtonBuilder>({
      components: [claimButton],
    });

    const transferMessage = await channel.send({
      content: pingedMessage,
      components: [components],
    });

    const filter = async (button: ButtonInteraction) => {
      const isCorrectButton = button.customId === voiceClaimHostId;
      const isMemberInVoice = getMemberIds().includes(button.user.id);
      const hasNoRoom = !(await this.vodService.mappingByUserId(
        button.user.id
      ));

      return isCorrectButton && isMemberInVoice && hasNoRoom;
    };

    try {
      const claim = await transferMessage.awaitMessageComponent({
        filter,
        componentType: ComponentType.Button,
        time: 60_000,
        dispose: true,
      });

      await claim.update({
        content: `${userMention(
          claim.user.id
        )} is now the new owner of the room!`,
        components: [],
      });

      return claim.member;
    } catch {
      return null;
    }
  }

  private async selectNewOwner(
    channel: VoiceChannel
  ): Promise<GuildMember | null> {
    const membersWithYesTheory = [...channel.members.values()].filter((m) =>
      hasRole(m, "Yes Theory")
    );
    const mappingsOfMembers = await Promise.all(
      membersWithYesTheory.map((m) => this.vodService.mappingByUserId(m.id))
    );

    const membersWithoutMapping = membersWithYesTheory.filter(
      (_, i) => !mappingsOfMembers[i]
    );

    if (membersWithoutMapping.length === 0) return null;

    const randomIndex = Math.floor(
      Math.random() * membersWithoutMapping.length
    );
    return membersWithoutMapping[randomIndex];
  }
}
