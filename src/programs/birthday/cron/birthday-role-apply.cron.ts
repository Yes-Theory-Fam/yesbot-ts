import { Client } from "discord.js";
import cron from "node-cron";
import { BirthdayRoleApplyActivity } from "./birthday-role-apply.activity";

export class BirthdayRoleApplyCron {
  public static init(client: Client) {
    cron.schedule("*/15 * * * *", async () => {
      try {
        const apply = new BirthdayRoleApplyActivity(client);
        await apply.applyBirthdayRoles();
        await apply.removeBirthdayRoles();
      } catch (error) {
        console.error(error);
      }
    });
  }
}
