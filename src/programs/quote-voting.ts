import { Command, CommandHandler, DiscordEvent } from "../event-distribution";
import { Message, Snowflake, TextChannel } from "discord.js";
import { TimerService } from "./timer/timer.service";
import { Timer } from "@yes-theory-fam/database/client";
import bot from "../index";

const quoteVotingIdentifier = "quotevoting";
const positiveEmojiName = "haha";
const negativeEmojiName = "eeeh";

const deleteRatio = 4 / 3;
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

    const emojiByName = (name: string) =>
      message.guild?.emojis.cache.find((e) => e.name === name);
    const positiveEmoji = emojiByName(positiveEmojiName);
    const negativeEmoji = emojiByName(negativeEmojiName);

    await message.react(positiveEmoji ?? "✅");
    await message.react(negativeEmoji ?? "❌");

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
        ?.count ?? 0;
    const positiveReactions = countByEmoji(positiveEmojiName);
    const negativeReactions = countByEmoji(negativeEmojiName);

    if (positiveReactions / negativeReactions < deleteRatio) {
      await message.delete();
    }

    if (positiveReactions / negativeReactions >= pinRatio) {
      await message.pin();
    }
  }
}
