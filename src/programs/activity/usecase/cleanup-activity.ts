import prisma from "../../../prisma";
import { Activity, Currency } from "@yes-theory-fam/database/client";
import { createYesBotLogger } from "../../../log";

export class CleanupActivity {
  private static cleanupActivityInstance: CleanupActivity;
  private static MS_PER_MINUTE = 60000;

  private delay =
    (!!process.env.ACTIVITY_TIME_DELAY
      ? Number.parseInt(process.env.ACTIVITY_TIME_DELAY)
      : 5) * CleanupActivity.MS_PER_MINUTE;

  private constructor() {}

  public static instance() {
    if (!CleanupActivity.cleanupActivityInstance) {
      CleanupActivity.cleanupActivityInstance = new CleanupActivity();
    }
    return CleanupActivity.cleanupActivityInstance;
  }

  public async findOldActivities() {
    const olderThen = new Date(Date.now() - this.delay);
    return await prisma.activity
      .findMany({
        take: 20,
        where: {
          updatedAt: {
            lt: olderThen,
          },
        },
      })
      .then((activities) => this.moveToCurrency(activities))
      .then(() => "finished");
  }

  private moveToCurrency(activities: Activity[]) {
    const data = activities.map((value) => {
      const activeTimeInMilliseconds =
        value.updatedAt.getTime() - value.createdAt.getTime();
      const activeMinutes: number = CleanupActivity.millisToMinutesAndSeconds(
        activeTimeInMilliseconds
      );
      const result = CleanupActivity.calculateValue(
        value.counter,
        activeMinutes
      );
      return { userId: value.userId, activeMinutes: result };
    });

    const movedActivities = data.map((value) => {
      return prisma.currency
        .findUnique({ where: { userId: value.userId } })
        .then((user: Currency) => {
          if (!!user) {
            return CleanupActivity.updateCurrencyForUser(value, user);
          } else {
            return CleanupActivity.createCurrencyForUser(value);
          }
        });
    });

    return Promise.all(movedActivities)
      .then(async () => {
        return activities.map(async (value) => {
          return await prisma.activity.delete({
            where: { id: value.id },
          });
        });
      })
      .then(() => logger.debug(`deleted activities: ${activities.length}`));
  }

  private static calculateValue(value: number, activeMinutes: number) {
    const counter = value === 0 ? 1 : value;
    const preFactor = counter / activeMinutes;
    const factor = Math.min(preFactor, 1);
    return activeMinutes * factor;
  }

  private static createCurrencyForUser(value: {
    activeMinutes: number;
    userId: any;
  }) {
    return prisma.currency.create({
      data: {
        userId: value.userId,
        ammount: value.activeMinutes,
      },
    });
  }

  private static updateCurrencyForUser(
    value: { activeMinutes: number; userId: any },
    user: Currency
  ) {
    return prisma.currency.update({
      where: {
        userId: value.userId,
      },
      data: {
        ammount: user.ammount + value.activeMinutes,
      },
    });
  }

  private static millisToMinutesAndSeconds(millis: number): number {
    return Math.floor(millis / 60000) + 1;
  }
}

const logger = createYesBotLogger("programs", CleanupActivity.name);
