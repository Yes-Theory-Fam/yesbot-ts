import { Client } from "discord.js";
import { ActivityCleanCron } from "./programs/activity/controller/activity-clean.cron";
import { BirthdayRoleApplyCron } from "./programs/birthday/cron/birthday-role-apply.cron";

export class LoadCron {
  private static loadCronInstance: LoadCron;

  private constructor(private client: Client) {
    LoadCron.initActivityCron();
    this.initBirthdayCron();
  }

  public static init(client: Client) {
    if (!LoadCron.loadCronInstance) {
      LoadCron.loadCronInstance = new LoadCron(client);
    }
  }

  private static initActivityCron() {
    ActivityCleanCron.init();
  }

  private initBirthdayCron() {
    BirthdayRoleApplyCron.init(this.client);
  }
}
