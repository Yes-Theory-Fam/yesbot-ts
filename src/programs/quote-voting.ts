import { Command, CommandHandler, DiscordEvent } from "../event-distribution";
import { Message, Snowflake, TextChannel } from "discord.js";
import { TimerService } from "./timer/timer.service";
import { Timer } from "@yes-theory-fam/database/client";
import bot from "../index";

const quoteVotingIdentifier = "quotevoting";
const positiveEmoji = "👍";
const negativeEmoji = "👎";

const deleteRatio = 4;
const pinRatio = 9;

interface QuoteVotingTimerData {
  channelId: Snowflake;
  messageId: Snowflake;
}

@Command({
  event: DiscordEvent.MESSAGE,
  channelNames: ["quotes"],
  description: "This handler starts the voting on messages posted in quotes.",
})
class QuoteMessage implements CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message): Promise<void> {
    if (message.system) {
      await message.delete();
      return;
    }

    await message.react(positiveEmoji);
    await message.react(negativeEmoji);

    const executeTime = new Date();
    executeTime.setDate(executeTime.getDate() + 1);
    await TimerService.createTimer(quoteVotingIdentifier, executeTime, {
      messageId: message.id,
      channelId: message.channel.id,
    });
  }
}

@Command({
  event: DiscordEvent.TIMER,
  handlerIdentifier: quoteVotingIdentifier,
})
class QuoteTally implements CommandHandler<DiscordEvent.TIMER> {
  async handle(timer: Timer): Promise<void> {
    const data = timer.data as unknown as QuoteVotingTimerData;
    const channel = bot.channels.resolve(data.channelId) as TextChannel;
    const message = await channel.messages.fetch(data.messageId);

    const countByEmoji = (name: string) =>
      message.reactions.cache.find((reaction) => reaction.emoji.name === name)
        .count ?? 0;
    const positiveReactions = countByEmoji(positiveEmoji);
    const negativeReactions = countByEmoji(negativeEmoji);

    if (positiveReactions / negativeReactions < deleteRatio) {
      await message.delete();
    }

    if (positiveReactions / negativeReactions >= pinRatio) {
      await message.pin();
    }
  }
}
