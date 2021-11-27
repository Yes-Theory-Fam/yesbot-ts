import distribution, { DiscordEvent } from "../../event-distribution";
import { Timer, Prisma } from "@yes-theory-fam/database/client";
import prisma from "../../prisma";
import { createYesBotLogger } from "../../log";

export class TimerService {
  private static async handleTimer(timer: Timer) {
    try {
      const exists = await prisma.timer.delete({
        where: { id: timer.id },
        select: { id: true },
      });

      if (!exists?.id) {
        // Cancelled
        return;
      }
    } catch (e) {
      if (
        !(e instanceof Prisma.PrismaClientKnownRequestError) ||
        e.code !== "P2025"
      ) {
        logger.error("Failed to delete timer entry: ", e);
      }
    }

    try {
      await distribution.handleEvent(DiscordEvent.TIMER, timer);
    } catch (e) {
      logger.error("Failed to handle timer event: ", e);
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

const logger = createYesBotLogger("programs", TimerService.name);
