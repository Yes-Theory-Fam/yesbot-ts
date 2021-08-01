import distribution, {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../event-distribution";
import { Client } from "discord.js";
import prisma from "../../prisma";
import { TimerService } from "./timer.service";

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
