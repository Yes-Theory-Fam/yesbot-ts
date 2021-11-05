import distribution, { DiscordEvent } from "../../event-distribution";
import { Timer, Prisma } from "@yes-theory-fam/database/client";
import prisma from "../../prisma";

export class TimerService {
  private static async handleTimer(timer: Timer) {
    const exists = await prisma.timer.delete({
      where: { id: timer.id },
      select: { id: true },
    });

    if (!exists?.id) {
      // Cancelled
      return;
    }

    try {
      await distribution.handleEvent(DiscordEvent.TIMER, timer);
    } finally {
      await prisma.timer.delete({ where: { id: timer.id } });
    }
  }

  public static scheduleTimer(timer: Timer): void {
    const timeDiff = timer.executeTime.getTime() - Date.now();
    if (timeDiff <= 0) {
      TimerService.handleTimer(timer);
    } else {
      setTimeout(() => TimerService.handleTimer(timer), timeDiff);
    }
  }

  public static async createTimer(
    handlerIdentifier: string,
    executeTime: Date,
    data?: Prisma.JsonValue
  ): Promise<string> {
    const timer = await prisma.timer.create({
      data: { handlerIdentifier, executeTime, data },
    });
    TimerService.scheduleTimer(timer);
    return timer.id;
  }

  public static async cancelTimer(id: string): Promise<boolean> {
    try {
      await prisma.timer.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }
}
