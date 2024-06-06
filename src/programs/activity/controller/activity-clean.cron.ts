import { CleanupActivity } from "../usecase/cleanup-activity.js";
import { createYesBotLogger } from "../../../log.js";
import cron from "node-cron";

export class ActivityCleanCron {
  static init() {
    cron.schedule("*/20 * * * * *", async () => {
      logger.debug("start cleaning activities");
      await CleanupActivity.instance()
        .cleanOldActivities()
        .then(() => {
          logger.debug("finished cleaning activities");
        });
    });
  }
}

const logger = createYesBotLogger("programs", ActivityCleanCron.name);
