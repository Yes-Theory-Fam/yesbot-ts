import cron from "node-cron";
import { Client, Snowflake } from "discord.js";
import prisma from "../../../prisma";
import {
  ghostedRematchDifferenceHours,
  ghostWarningMessageRegex,
} from "./constants";
import { createYesBotLogger } from "../../../log";

export class BuddyGhostCheck {
  private static cronSchedule = "*/10 * * * *"; // Every 10 minutes

  constructor(private bot: Client) {}

  static init(bot: Client) {
    cron.schedule(BuddyGhostCheck.cronSchedule, () => {
      new BuddyGhostCheck(bot)
        .check()
        .catch((e) =>
          logger.error("Encountered error checking ghosted entries", e)
        );
    });
  }

  async check() {
    const referenceTime = new Date();
    referenceTime.setHours(
      referenceTime.getHours() - ghostedRematchDifferenceHours
    );
    const relevantGhostedEntries = await this.findRelevantGhostedEntries(
      referenceTime
    );

    for (const ghostEntry of relevantGhostedEntries) {
      const { userId, buddyId } = ghostEntry;
      await this.updateDatabase(userId, buddyId);
      await this.notifyGhostedUser(userId);
      await this.notifyGhostingUser(buddyId);
    }

    logger.info(
      `[GhostCheck] Handled ${relevantGhostedEntries.length} ghosted members`
    );
  }

  findRelevantGhostedEntries(referenceDate: Date) {
    return prisma.buddyProjectEntry.findMany({
      where: {
        reportedGhostDate: {
          lte: referenceDate,
        },
      },
    });
  }

  async updateDatabase(userId: Snowflake, buddyId: Snowflake) {
    await prisma.buddyProjectEntry.update({
      where: { userId },
      data: { buddyId: null, matchedDate: null, reportedGhostDate: null },
    });

    await prisma.buddyProjectEntry.delete({ where: { userId: buddyId } });
  }

  async notifyGhostedUser(userId: Snowflake) {
    const user = await this.bot.users.fetch(userId);
    const dm = await user.createDM();
    await dm.send(
      "Hey there! Sadly your buddy didn't respond to me in time, sorry! I removed your match so you will be rematched again soon :)"
    );
  }

  async notifyGhostingUser(userId: Snowflake) {
    const user = await this.bot.users.fetch(userId);
    const dm = await user.createDM();
    // Let's hope 50 are enough :)
    const lastMessages = await dm.messages.fetch({ limit: 50 });
    const ghostWarningMessage = lastMessages.find(
      (m) => m.author.bot && !!m.content.match(ghostWarningMessageRegex)
    );

    await ghostWarningMessage.reactions.removeAll();
    await ghostWarningMessage.edit(
      `**Buddy Project Ghosted**

Hey there! It appears you have gone offline on us and didn't reach out to your buddy. I tried contacting you but without success 😦
As a consequence I removed your signup from the buddy project. Once you are around again, feel free to sign up again at <https://yestheory.family/buddyproject> and be sure to stick around on Discord!`
    );
  }
}

const logger = createYesBotLogger("buddy-project", BuddyGhostCheck.name);
