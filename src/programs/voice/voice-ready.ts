import { Client, VoiceChannel } from "discord.js";
import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../event-distribution";
import prisma from "../../prisma";
import { TimerService } from "../timer/timer.service";
import VoiceOnDemandTools, {
  voiceOnDemandDeleteIdentifier,
  voiceOnDemandRequestHostIdentifier,
} from "./common";

@Command({
  event: DiscordEvent.READY,
})
class VoiceOnDemandReady implements CommandHandler<DiscordEvent.READY> {
  async handle(bot: Client): Promise<void> {
    const guild = bot.guilds.resolve(process.env.GUILD_ID);
    const mappings = await prisma.voiceOnDemandMapping.findMany();
    for (let i = 0; i < mappings.length; i++) {
      const { channelId, userId } = mappings[i];
      const channel = guild.channels.resolve(channelId) as VoiceChannel;

      if (channel === null) {
        await VoiceOnDemandTools.removeMapping(channelId);
        return;
      }

      if (channel.members.size === 0) {
        const executeTime = new Date();
        executeTime.setMinutes(executeTime.getMinutes() + 1);
        await TimerService.createTimer(
          voiceOnDemandDeleteIdentifier,
          executeTime,
          {
            channelId: channel.id,
          }
        );
        return;
      }

      if (channel.members.every((member) => member.id !== userId)) {
        const executeTime = new Date();
        executeTime.setMinutes(executeTime.getMinutes() + 1);
        await TimerService.createTimer(
          voiceOnDemandRequestHostIdentifier,
          executeTime,
          {
            channelId: channelId,
          }
        );
      }
    }
  }
}
