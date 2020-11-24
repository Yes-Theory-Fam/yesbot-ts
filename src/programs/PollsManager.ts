import {
  Message,
  MessageReaction,
  DMChannel,
  User,
  PartialUser,
  EmojiResolvable,
  Client,
} from "discord.js";
import { hasRole } from "../common/moderator";

// Resolves emojis (unicode and discord) at the start of a line
const getEmojis = (lines: string[], bot: Client): string[] => {
  // From http://www.unicode.org/reports/tr51/tr51-18.html#EBNF_and_Regex
  const unicodeEmojiRegex = /^(\p{RI}\p{RI}|\p{Emoji}(\p{Emoji_Modifier_Base}|\uFE0F\u20E3?|[\u{E0020}-\u{E007E}]+\u{E007F})?(\u{200D}\p{Emoji}(\p{Emoji_Modifier_Base}|\uFE0F\u20E3?|[\u{E0020}-\u{E007E}]+\u{E007F})?)*)/gu;

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

  return result;
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

export default async function PollsManager(pMessage: Message) {
  if (pMessage.author.bot) {
    return;
  }

  const lines = pMessage.cleanContent.split("\n");
  const resolvedEmojis = resolveEmojis(lines.map(removeSpecialCharactersFromBeginning), pMessage.client);
  const unique = resolvedEmojis.filter(
    (e, i) => resolvedEmojis.indexOf(e) === i
  );
  const partitioned = partition(unique, 20);

  for (let i = 0; i < partitioned.length; i++) {
    const message =
      i === 0 ? pMessage : await pMessage.channel.send("More options");

    const partition = partitioned[i];
    for (const emoji of partition) {
      await message.react(emoji);
    }
  }
}

const removeSpecialCharactersFromBeginning = (content: string) => {
  return content.replace(/^\p{P}*/u, '');
}

export const ModeratorPollMirror = async (
  reaction: MessageReaction,
  user: User | PartialUser
) => {
  const { message } = reaction;
  const { channel } = message;
  if (channel instanceof DMChannel || channel.name !== "polls") return;
  const member = channel.guild.member(user.id);

  if (!hasRole(member, "Support")) return;
  const fetched = await reaction.users.fetch();
  if (fetched.size > 1) return;

  message.react(reaction.emoji);
  reaction.users.remove(user.id);
};
