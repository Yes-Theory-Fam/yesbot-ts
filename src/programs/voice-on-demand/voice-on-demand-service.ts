import { VoiceOnDemandMapping } from "@prisma/client";
import {
  ChatInputCommandInteraction,
  GuildMember,
  Snowflake,
  VoiceChannel,
} from "discord.js";
import prisma from "../../prisma.js";
import { TimerService } from "../timer/timer.service.js";
import { DeleteIfEmptyTimer } from "./timers/delete-if-empty-timer.js";
import { VoiceOnDemandErrors } from "./common.js";
import { DetermineNewOwnerTimer } from "./timers/determine-new-owner-timer.js";

const timeout = (ms: number) => new Promise<void>((res) => setTimeout(res, ms));

export class VoiceOnDemandService {
  async mappingByUserId(
    userId: Snowflake
  ): Promise<VoiceOnDemandMapping | null> {
    return prisma.voiceOnDemandMapping.findUnique({
      where: { userId },
    });
  }

  async mappingByChannelId(
    channelId: Snowflake
  ): Promise<VoiceOnDemandMapping | null> {
    return prisma.voiceOnDemandMapping.findUnique({
      where: { channelId },
    });
  }

  getChannelName(member: GuildMember, emoji: string) {
    return `• ${emoji} ${member.displayName}'s Room`;
  }

  async updateLimit(
    interaction: ChatInputCommandInteraction,
    getLimit: (channel: VoiceChannel) => Promise<number> | number
  ) {
    const mapping = await this.mappingByUserId(interaction.user.id);
    if (!mapping) throw new Error(VoiceOnDemandErrors.HAS_NO_ROOM);

    const channel = (await interaction.guild!.channels.fetch(
      mapping.channelId
    )) as VoiceChannel;
    const limit = await getLimit(channel);

    await channel.setUserLimit(limit);

    await interaction.reply({
      content: `Successfully changed the limit of your room to ${limit}`,
      ephemeral: true,
    });
  }

  /**
   * @returns The response message
   */
  async transferRoomOwnership(
    newOwner: GuildMember,
    channel: VoiceChannel,
    emoji: string
  ): Promise<string> {
    await prisma.voiceOnDemandMapping.update({
      where: { channelId: channel.id },
      data: { userId: newOwner.id },
    });

    const newChannelName = this.getChannelName(newOwner, emoji);

    /*
    Discord has a fairly strict rate-limit on renaming channels.
    When changing owners quickly after each other, it may happen that channel.setName takes >= 10 minutes
    We race changing the channel name against 3 seconds after which we can display a message to let the member know
      what's happening
     */
    const channelUpdateResult = await Promise.race([
      channel.setName(newChannelName),
      timeout(3000),
    ]);

    const baseMessage = `I transferred ownership of your room to <@${newOwner.id}>!`;
    const nameUpdateDelayMessage = `Discord imposes a fairly strict rate-limit on renaming channels, so that might take a while to update!`;

    return `${baseMessage}\n\n${
      channelUpdateResult ? "" : nameUpdateDelayMessage
    }`;
  }

  async deleteVodChannel(channel: VoiceChannel) {
    await channel.delete();
    await prisma.voiceOnDemandMapping.delete({
      where: { channelId: channel.id },
    });
  }

  async resetDeleteIfEmptyTimer(channelId: Snowflake) {
    await this.resetTimer(channelId, DeleteIfEmptyTimer.identifier);
  }

  async resetRequireNewOwnerTimer(channelId: Snowflake) {
    await this.resetTimer(channelId, DetermineNewOwnerTimer.identifier);
  }

  private async resetTimer(channelId: Snowflake, identifier: string) {
    await prisma.timer.deleteMany({
      where: {
        handlerIdentifier: identifier,
        data: {
          path: ["channelId"],
          equals: channelId,
        },
      },
    });

    const runAt = new Date();
    runAt.setMinutes(runAt.getMinutes() + 1);
    await TimerService.createTimer(identifier, runAt, {
      channelId,
    });
  }
}
