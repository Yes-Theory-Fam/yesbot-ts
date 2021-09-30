import { ActivityCleanCron } from "./programs/activity/controller/activity-clean.cron";

export class LoadCron {
  private static loadCronInstance: LoadCron;

  private constructor() {
    LoadCron.initActivityCron();
  }

  public static init() {
    if (!LoadCron.loadCronInstance) {
      LoadCron.loadCronInstance = new LoadCron();
    }
  }

  private static initActivityCron() {
    ActivityCleanCron.init();
  }
}
