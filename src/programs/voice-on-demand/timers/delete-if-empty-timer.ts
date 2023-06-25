import { Timer } from "@prisma/client";
import { ChannelType, DiscordAPIError, GuildBasedChannel } from "discord.js";
import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../../event-distribution";
import bot from "../../../index";
import { VoiceOnDemandService } from "../voice-on-demand-service";
import { RESTJSONErrorCodes } from "discord-api-types/v10";

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

    let channel: GuildBasedChannel | null;

    try {
      channel = await guild.channels.fetch(channelId);
    } catch (e) {
      if (
        e instanceof DiscordAPIError &&
        e.code === RESTJSONErrorCodes.UnknownChannel
      ) {
        return;
      }

      throw e;
    }

    if (!channel || channel.type !== ChannelType.GuildVoice) return;

    const memberCount = channel.members.size;

    if (memberCount !== 0) return;

    const vodService = new VoiceOnDemandService();
    await vodService.deleteVodChannel(channel);
  }
}
