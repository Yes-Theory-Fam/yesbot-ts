import {
  Command,
  CommandHandler,
  DiscordEvent,
  EventLocation,
} from "../../event-distribution/index.js";
import {
  cleanupSpamTracker,
  getSpamActivity,
  registerMessage,
  resetSpam,
} from "./spam-tracker.js";
import { Client, Message } from "discord.js";
import Tools from "../../common/tools.js";

@Command({
  event: DiscordEvent.READY,
  description: "Start the rate limiter",
})
class RateLimiterStart implements CommandHandler<DiscordEvent.READY> {
  async handle(bot: Client): Promise<void> {
    setInterval(cleanupSpamTracker, 45_000);
  }
}

@Command({
  event: DiscordEvent.MESSAGE,
  location: EventLocation.SERVER,
  description:
    "This is a rate limiter to check if a user is spamming in 5 different channels in under 15 seconds",
})
class AntiSpamHandler implements CommandHandler<DiscordEvent.MESSAGE> {
  private static readonly timeoutDuration = 10 * 60 * 1000;

  async handle(message: Message): Promise<void> {
    if (message.author.bot) return;

    const guild = message.guild;
    if (!guild) return;

    const isSpamming = registerMessage(message);
    if (!isSpamming) return;

    const userId = message.author.id;
    const member = await guild.members.fetch(userId);
    await member?.timeout(
      AntiSpamHandler.timeoutDuration,
      "Tripped YesBot Ratelimiter"
    );

    const spamActivities = getSpamActivity(message.author.id);
    for (const { channelId, messageId } of spamActivities) {
      const channel = guild.channels.cache.find((c) => c.id === channelId);
      if (!channel || !channel.isTextBased()) continue;
      await channel.messages.delete(messageId);
    }
    resetSpam(userId);

    const botDev = message.guild?.channels.cache.find(
      (c) => c.name === "bot-development"
    );
    if (!botDev?.isSendable()) return;

    await botDev.send(
      `Actioned spam, deleting ${spamActivities.length} messages by ${member} from the last ~15 seconds.`
    );
  }
}
