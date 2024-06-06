import cron from "node-cron";
import { Client, TextChannel, ThreadChannel } from "discord.js";
import { ChatNames } from "../../../collections/chat-names.js";
import { createYesBotLogger } from "../../../log.js";

interface OldThreads {
  toWarn: ThreadChannel[];
  toDelete: ThreadChannel[];
}

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

  findOldThreads(): OldThreads {
    const guild = this.bot.guilds.resolve(process.env.GUILD_ID);
    const threadParent = guild?.channels.cache.find(
      (c): c is TextChannel => c.name === ChatNames.BUDDY_PROJECT_INFO
    );

    const allThreads = threadParent?.threads.cache.values() ?? [];
    const nowTimestamp = Date.now();

    const result: OldThreads = { toDelete: [], toWarn: [] };

    for (const thread of allThreads) {
      const channelLifetimeInMinutes =
        (nowTimestamp - (thread.createdTimestamp ?? 0)) / 1000 / 60;

      if (
        channelLifetimeInMinutes > RescueForceClose.threadMaxLifetimeMinutes
      ) {
        result.toDelete.push(thread);
        continue;
      }

      if (
        RescueForceClose.threadMaxLifetimeMinutes - channelLifetimeInMinutes <
        RescueForceClose.schedulingMinutes
      ) {
        result.toWarn.push(thread);
      }
    }

    return result;
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
