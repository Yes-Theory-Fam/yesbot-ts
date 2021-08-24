import {
  Client,
  EmojiResolvable,
  Message,
  MessageReaction,
  PartialUser,
  User,
} from "discord.js";
import { unicodeEmojiRegex } from "../common/tools";
import { Command, CommandHandler, DiscordEvent } from "../event-distribution";

// Resolves emojis (unicode and discord) at the start of a line
const getEmojis = (lines: string[], bot: Client): string[] => {
  const isAvailableDiscordEmoji = (id: string) => bot.emojis.cache.has(id);
  const discordEmojiRegex = /^<:.*?:(.*?)>/;

  const result = [];
  for (const line of lines) {
    const unicodeMatch = line.match(unicodeEmojiRegex);
    if (unicodeMatch) {
      result.push(unicodeMatch[0]);
      continue;
    }

    const discordMatch = line.match(discordEmojiRegex);
    if (discordMatch && isAvailableDiscordEmoji(discordMatch[1])) {
      result.push(discordMatch[1]);
    }
  }

  return result.filter((emoji) => {
    const isNumber = /^\d$/.test(emoji);
    return !isNumber;
  });
};

const letterToEmoji = (letter: string) => {
  const unicodeOffset = 0x1f1e6; //Regional Indicator A
  const asciiOffset = "A".charCodeAt(0);

  if (letter === "B") return "🅱️";
  const letterIndex = letter.charCodeAt(0) - asciiOffset;
  const unicodeCodePoint = unicodeOffset + letterIndex;
  return String.fromCodePoint(unicodeCodePoint);
};

// Resolves single letters at the start of a line and returns their unicode version
const getLetterEmojis = (lines: string[]): string[] => {
  return lines
    .map((line) => line.toUpperCase().split(/\b/)[0])
    .filter((firstWord) => firstWord.match(/^[A-Z]$/))
    .map(letterToEmoji);
};

const resolveEmojis = (lines: string[], bot: Client): EmojiResolvable[] => {
  const emojiEmojis = getEmojis(lines, bot);

  if (emojiEmojis && emojiEmojis.length > 0) {
    return emojiEmojis;
  }

  const letterEmojis = getLetterEmojis(lines);
  if (letterEmojis && letterEmojis.length > 0) {
    return letterEmojis;
  }

  return ["A", "B"].map(letterToEmoji);
};

const partition = <T>(items: T[], size: number): T[][] => {
  const output: T[][] = [];

  for (let i = 0; i < items.length; i += size) {
    output.push(items.slice(i, i + size));
  }

  return output;
};

const removeSpecialCharactersFromBeginning = (content: string) => {
  return content.replace(/^\p{P}*/u, "");
};

@Command({
  event: DiscordEvent.MESSAGE,
  channelNames: ["polls"],
  description: "This handler is to add the emojis to the polls",
})
class Polls implements CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message): Promise<void> {
    if (message.author.bot) {
      return;
    }

    const lines = message.cleanContent.split("\n");
    const resolvedEmojis = resolveEmojis(
      lines.map(removeSpecialCharactersFromBeginning),
      message.client
    );
    const unique = resolvedEmojis.filter(
      (e, i) => resolvedEmojis.indexOf(e) === i
    );
    const partitioned = partition(unique, 20);

    for (let i = 0; i < partitioned.length; i++) {
      const reactMessage =
        i === 0 ? message : await message.channel.send("More options");

      const partition = partitioned[i];
      for (const emoji of partition) {
        await reactMessage.react(emoji);
      }
    }
  }
}

@Command({
  event: DiscordEvent.REACTION_ADD,
  channelNames: ["polls"],
  allowedRoles: ["Support"],
  emoji: "",
  description:
    "This handler mirrors a Support member's new reaction on a poll.",
})
class ModeratorPollMirror implements CommandHandler<DiscordEvent.REACTION_ADD> {
  async handle(reaction: MessageReaction, user: User | PartialUser) {
    const { message } = reaction;

    const fetched = await reaction.users.fetch();
    if (fetched.size > 1) return;

    await message.react(reaction.emoji);
    await reaction.users.remove(user.id);
  }
}
