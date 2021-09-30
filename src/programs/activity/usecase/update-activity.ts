import { UpdateActivityType } from "../types/update-activity.type";
import prisma from "../../../prisma";
import { createYesBotLogger } from "../../../log";
import { Activity } from "@yes-theory-fam/database/client";

export class UpdateActivity {
  private static updateActivityInstance: UpdateActivity;
  private delay = new Date().setMinutes(
    Number.parseInt(process.env.ACTIVITY_TIME_DELAY) | 5
  );

  async handle(data: UpdateActivityType) {
    const date = new Date(Date.now() - this.delay);
    UpdateActivity.findActivity(data, date)
      .then((activity) => {
        if (!!activity) {
          return UpdateActivity.updateActivity(activity);
        } else {
          return UpdateActivity.createActivity(data);
        }
      })
      .then((data) => logger.debug(`activity created for ${data.userId}`));
  }

  private static createActivity(data: UpdateActivityType) {
    return prisma.activity.create({
      data: {
        userId: data.userId,
      },
    });
  }

  private static updateActivity(activity: Activity) {
    return prisma.activity.update({
      where: {
        id: activity.id,
      },
      data: {
        counter: activity.counter + 1,
      },
    });
  }

  private static findActivity(data: UpdateActivityType, date: Date) {
    return prisma.activity.findFirst({
      where: {
        AND: [
          { userId: data.userId },
          {
            updatedAt: {
              gte: date,
            },
          },
        ],
      },
    });
  }

  public static instance() {
    if (!UpdateActivity.updateActivityInstance) {
      UpdateActivity.updateActivityInstance = new UpdateActivity();
    }
    return UpdateActivity.updateActivityInstance;
  }
}

const logger = createYesBotLogger("programs", UpdateActivity.name);
