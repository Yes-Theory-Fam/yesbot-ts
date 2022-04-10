import { Client } from "discord.js";
import cron from "node-cron";
import { textLog } from "../../../common/moderator";
import Tools from "../../../common/tools";
import { createYesBotLogger } from "../../../log";
import { BirthdayRoleApplyActivity } from "./birthday-role-apply.activity";

export class BirthdayRoleApplyCron {
  private static readonly logger = createYesBotLogger(
    "birthday",
    BirthdayRoleApplyCron.name
  );

  public static init(client: Client) {
    cron.schedule("*/15 * * * *", async () => {
      try {
        const apply = new BirthdayRoleApplyActivity(client);
        await apply.applyBirthdayRoles();
        await apply.removeBirthdayRoles();
      } catch (error) {
        const guild = client.guilds.resolve(process.env.GUILD_ID);
        const devRole = Tools.getRoleByName(
          process.env.ENGINEER_ROLE_NAME,
          guild
        );

        await textLog(`Failed to apply birthday roles ${devRole}`);
        this.logger.error("Failed to ", error);
      }
    });
  }
}
