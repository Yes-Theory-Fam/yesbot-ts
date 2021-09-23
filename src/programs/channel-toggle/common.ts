import { Guild, Snowflake, TextChannel, User } from "discord.js";
import { Message as MessageEntity } from "@yes-theory-fam/database/client";
import prisma from "../../prisma";
import bot from "../..";

export const getOrCreateMessage = async (
  messageId: Snowflake
): Promise<MessageEntity> => {
  const existingMessage = await prisma.message.findUnique({
    where: { id: messageId },
  });
  if (existingMessage) return existingMessage;
  return await prisma.message.create({ data: { id: messageId } });
};

export async function backfillReactions(
  messageId: string,
  channelId: string,
  guild: Guild
) {
  const channel = guild.channels.cache.find(
    (c) => c.id === channelId
  ) as TextChannel;

  if (!channel) {
    throw new Error("I can't find that channel. Maybe it has been deleted?");
  }

  const reactionDiscordMessage = await channel.messages.fetch(messageId);
  const toggles = await prisma.channelToggle.findMany({
    where: { messageId },
    orderBy: { id: "asc" },
  });

  // Only add missing reactions
  for (let i = 0; i < toggles.length; i++) {
    await reactionDiscordMessage.react(toggles[i].emoji);
  }
}

export const revokeToggleChannelPermissions = async (
  user: User,
  channelId: string
) => {
  const channel = bot.channels.resolve(channelId) as TextChannel;
  await channel.permissionOverwrites.get(user.id)?.delete();
};
