interface SpamRecord {
  messages: { channelId: string; timestamp: number }[];
}

const userSpamActivity = new Map<string, SpamRecord>();

const TIME_WINDOW = 15 * 1000;
const CHANNEL_THRESHOLD = 5;

export function registerMessage(userId: string, channelId: string): boolean {
  const now = Date.now();

  let record = userSpamActivity.get(userId);
  if (!record) {
    record = { messages: [] };
    userSpamActivity.set(userId, record);
  }

  record.messages = record.messages.filter(
    (msg) => now - msg.timestamp <= TIME_WINDOW
  );

  record.messages.push({ channelId, timestamp: now });

  const uniqueChannels = new Set(record.messages.map((msg) => msg.channelId));

  if (uniqueChannels.size >= CHANNEL_THRESHOLD) {
    userSpamActivity.delete(userId);
    return true;
  }

  return false;
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
