import { CleanupActivity } from "../usecase/cleanup-activity";
import { createYesBotLogger } from "../../../log";

var cron = require("node-cron");

export class ActivityCleanCron {
  static init() {
    cron.schedule("*/20 * * * * *", async () => {
      logger.info("start cleaning activities");
      await CleanupActivity.instance()
        .findOldActivities()
        .then(() => {
          logger.info("finished cleaning activities");
        });
    });
  }
}

const logger = createYesBotLogger("programs", ActivityCleanCron.name);
