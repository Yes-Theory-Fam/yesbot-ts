import {
  Command,
  CommandHandler,
  DiscordEvent,
  EventLocation,
} from "../../event-distribution/index.js";
import { cleanupSpamTracker, registerMessage } from "./spam-tracker.js";
import { Client, Message } from "discord.js";

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
  description:
    "This is a rate limiter to check if a user is spamming in 5 different channels in under 15 seconds",
})
class AntiSpamHandler implements CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message): Promise<void> {
    if (message.author.bot) return;

    const isSpamming = registerMessage(message.author.id, message.channel.id);

    if (isSpamming) {
      console.log("wooooo detected spam");
    }
  }
}
