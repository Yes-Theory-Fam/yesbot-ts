import { ActivityCleanCron } from "./programs/activity/controller/activity-clean.cron";
import { Client } from "discord.js";
import { BuddyProjectMatching } from "./programs/buddy-project/matching/matching";
import { BuddyGhostCheck } from "./programs/buddy-project/ghost/ghost-check";
import { RescueForceClose } from "./programs/buddy-project/find-buddy/rescue-force-close";

export class LoadCron {
  private static loadCronInstance: LoadCron;

  private constructor(private bot: Client) {
    LoadCron.initActivityCron();
    this.initBuddyProjectCrons();
  }

  public static init(bot: Client) {
    if (!LoadCron.loadCronInstance) {
      LoadCron.loadCronInstance = new LoadCron(bot);
    }
  }

  private static initActivityCron() {
    ActivityCleanCron.init();
  }

  private initBuddyProjectCrons() {
    BuddyProjectMatching.init(this.bot);
    BuddyGhostCheck.init(this.bot);
    RescueForceClose.init(this.bot);
  }
}
