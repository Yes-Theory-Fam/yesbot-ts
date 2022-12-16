import { Timer } from "@prisma/client";
import { ChannelType } from "discord.js";
import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../../event-distribution";
import bot from "../../../index";
import prisma from "../../../prisma";
import { VoiceOnDemandService } from "../voice-on-demand-service";

/*
TODO have a look at this scenario
 - Owner leaves as last (-> DeleteIfEmpty + DetermineNewOwner)
 - After 30 seconds, user joins
 - After 10 more second, user leaves (-> DeleteIfEmpty resets)
 - (DetermineNewOwner triggers, finds empty room, skips)
 - Joins again after 30 seconds (-> uncontrolled room but no prompt)
 */

@Command({
  event: DiscordEvent.TIMER,
  handlerIdentifier: DeleteIfEmptyTimer.identifier,
})
export class DeleteIfEmptyTimer extends CommandHandler<DiscordEvent.TIMER> {
  static readonly identifier = "delete-if-empty-timer";

  async handle(timer: Timer): Promise<void> {
    const { channelId } = timer.data as { channelId: string };
    const guild = bot.guilds.resolve(process.env.GUILD_ID)!;

    const channel = await guild.channels.fetch(channelId);

    if (!channel || channel.type !== ChannelType.GuildVoice) return;

    const memberCount = channel.members.size;

    if (memberCount !== 0) return;

    const vodService = new VoiceOnDemandService();
    await vodService.deleteVodChannel(channel);
  }
}
