import { Command, CommandHandler, DiscordEvent } from "../event-distribution";
import {
  Client,
  Guild,
  Message,
  Snowflake,
  TextChannel,
  ThreadAutoArchiveDuration,
} from "discord.js";
import { TimerService } from "./timer/timer.service";
import { Timer } from "@prisma/client";
import bot from "../index";
import { ChatNames } from "../collections/chat-names";

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
  event: DiscordEvent.READY,
  description: "This is a description wow!",
})
class CreateThreadIfNonExistent implements CommandHandler<DiscordEvent.READY> {
  async handle(bot: Client): Promise<void> {
    const guild = await bot.guilds.resolve(process.env.GUILD_ID);
    const quoteChannel = guild?.channels.cache.find(
      (c) => c.name == ChatNames.QUOTES
    ) as TextChannel;
    const hasQuoteThread = quoteChannel.threads.cache.find(
      (t) => t.name == ChatNames.HIGHLIGHTED_QUOTES
    );
    if (!hasQuoteThread) {
      await quoteChannel.threads.create({ name: "Highlighted Quotes" });
    }
  }
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
      const highlightedThread = channel.threads.cache.find(
        (t) => t.name == ChatNames.HIGHLIGHTED_QUOTES
      );
      const messageText = await checkEmojis(message, message.guild);
      const maybeImage = message.attachments;
      highlightedThread?.send(
        `Member: <@${message.author.id}> quote won a place on the wall of fame! He quotes: \n ${messageText}`
      );
      maybeImage.forEach((a) => highlightedThread?.send({ files: [a] }));
    }
  }
}

const checkEmojis = async (message: Message, guild: Guild | null) => {
  let content = message.content;
  const emojis = message.content.match(/<:[a-z | 1-99].{0,}>/gi);
  emojis?.forEach((e) => {
    const tempE = e.replace(/:/g, "");
    const maybeEmoji = guild?.emojis.cache.find(
      (guildEmoji) => guildEmoji.name == tempE
    );
    const regex = new RegExp(e, "g");
    if (!maybeEmoji) content = message.content.replace(regex, "");
  });
  return content;
};
