import { Message, Snowflake } from "discord.js";

interface SpamRecord {
  messages: { channelId: Snowflake; timestamp: number; messageId: Snowflake }[];
}

const userSpamActivity = new Map<Snowflake, SpamRecord>();

const TIME_WINDOW = 15 * 1000;
const CHANNEL_THRESHOLD = 5;

export function registerMessage(message: Message): boolean {
  const now = Date.now();

  const userId = message.author.id;
  const channelId = message.channelId;
  const messageId = message.id;

  let record = userSpamActivity.get(userId);
  if (!record) {
    record = { messages: [] };
    userSpamActivity.set(userId, record);
  }

  record.messages = record.messages.filter(
    (msg) => now - msg.timestamp <= TIME_WINDOW
  );

  record.messages.push({ channelId, messageId, timestamp: now });

  const uniqueChannels = new Set(record.messages.map((msg) => msg.channelId));

  return uniqueChannels.size >= CHANNEL_THRESHOLD;
}

export function getSpamActivity(userId: Snowflake) {
  return userSpamActivity.get(userId)?.messages ?? [];
}

export function resetSpam(userId: Snowflake) {
  userSpamActivity.delete(userId);
}

export function cleanupSpamTracker(): void {
  const now = Date.now();
  for (const [userId, record] of userSpamActivity.entries()) {
    if (
      record.messages.length === 0 ||
      now - record.messages[record.messages.length - 1].timestamp > TIME_WINDOW
    ) {
      userSpamActivity.delete(userId);
    }
  }
}
