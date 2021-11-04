import cron from "node-cron";
import { Client, TextChannel, ThreadChannel } from "discord.js";
import { ChatNames } from "../../../collections/chat-names";
import { createYesBotLogger } from "../../../log";

export class RescueForceClose {
  static schedulingMinutes = 5;
  static threadMaxLifetimeMinutes = 60;

  constructor(private bot: Client) {}

  static init(bot: Client) {
    cron.schedule(`*/${this.schedulingMinutes} * * * *`, () => {
      new RescueForceClose(bot)
        .handleOldThreads()
        .catch((e) =>
          logger.error("Failed to force close rescue threads: ", e)
        );
    });
  }

  async handleOldThreads(): Promise<void> {
    const { toDelete, toWarn } = this.findOldThreads();
    const warnThreads = this.warnThreads(toWarn);
    const deleteThreads = this.deleteThreads(toDelete);
    await Promise.all([warnThreads, deleteThreads]);
  }

  findOldThreads(): { toDelete: ThreadChannel[]; toWarn: ThreadChannel[] } {
    const guild = this.bot.guilds.resolve(process.env.GUILD_ID);
    const threadParent = guild.channels.cache.find(
      (c): c is TextChannel => c.name === ChatNames.BUDDY_PROJECT_INFO
    );

    const allThreads = threadParent.threads.cache.values();
    const nowTimestamp = Date.now();

    /*
    12:00 - 11:00 > 1
    12:00 - 11:05
    A thread shall be deleted if now - createdTime > threadMaxLifetimeMinutes
    A thread shall be warned if threadMaxLifetimeMinutes - now - createdTime < schedulingMinutes
     */
    return [...allThreads].reduce(
      (acc, current) => {
        const channelLifetime = nowTimestamp - current.createdTimestamp;
        if (channelLifetime > RescueForceClose.threadMaxLifetimeMinutes) {
          acc.toDelete.push(current);
        }

        if (
          RescueForceClose.threadMaxLifetimeMinutes - channelLifetime <
          RescueForceClose.schedulingMinutes
        ) {
          acc.toWarn.push(current);
        }

        return acc;
      },
      { toDelete: [], toWarn: [] }
    );
  }

  async warnThreads(threads: ThreadChannel[]) {
    const promises = threads.map((thread) =>
      thread.send(
        "Quick note: This channel will be removed in 5 minutes. If you started a conversation here, be sure to move to DMs!"
      )
    );

    await Promise.all(promises);
  }

  async deleteThreads(threads: ThreadChannel[]) {
    const promises = threads.map((thread) => thread.delete());
    await Promise.all(promises);
  }
}

const logger = createYesBotLogger("buddy-project", RescueForceClose.name);
