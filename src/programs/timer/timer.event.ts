import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../event-distribution/index.js";
import { Client } from "discord.js";
import prisma from "../../prisma.js";
import { TimerService } from "./timer.service.js";

@Command({
  event: DiscordEvent.READY,
})
class TimerEvent implements CommandHandler<DiscordEvent.READY> {
  async handle(bot: Client): Promise<void> {
    const timers = await prisma.timer.findMany();
    for (const timer of timers) {
      TimerService.scheduleTimer(timer);
    }
  }
}
