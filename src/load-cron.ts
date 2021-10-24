import { ActivityCleanCron } from "./programs/activity/controller/activity-clean.cron";
import { Client } from "discord.js";
import { BuddyProjectMatching } from "./programs/buddy-project/matching/matching";

export class LoadCron {
  private static loadCronInstance: LoadCron;

  private constructor(private bot: Client) {
    LoadCron.initActivityCron();
    this.initBuddyProjectMatchingCron();
  }

  public static init(bot: Client) {
    if (!LoadCron.loadCronInstance) {
      LoadCron.loadCronInstance = new LoadCron(bot);
    }
  }

  private static initActivityCron() {
    ActivityCleanCron.init();
  }

  private initBuddyProjectMatchingCron() {
    BuddyProjectMatching.init(this.bot);
  }
}
