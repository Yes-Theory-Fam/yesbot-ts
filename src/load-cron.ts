import { ActivityCleanCron } from "./programs/activity/controller/activity-clean.cron";
import { Client } from "discord.js";
import { RescueForceClose } from "./programs/buddy-project/find-buddy/rescue-force-close";
import { RoleResetCron } from "./programs/nitro-colors";

export class LoadCron {
  private static loadCronInstance: LoadCron;

  private constructor(private bot: Client) {
    LoadCron.initActivityCron();
    this.initNitroRolesCron();
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
    RescueForceClose.init(this.bot);
  }

  private initNitroRolesCron() {
    RoleResetCron.init();
  }
}
