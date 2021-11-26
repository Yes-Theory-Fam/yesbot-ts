import { UsersOnBreak } from "@yes-theory-fam/database/client";
import prisma from "../../prisma";
import {
  Message,
  DMChannel,
  CollectorFilter,
  MessageReaction,
  User,
} from "discord.js";
import state from "../../common/state";
import { createYesBotLogger } from "../../log";

export const mainOptionsEmojis = ["👶", "🦥"];
export const allCollectedEmojis = ["👶", "🦥", "✅", "🚫"];

export const logger = createYesBotLogger("programs", "DmMenu");

export const handleError = async (
  optionsMessage: Message,
  dmChannel: DMChannel
) => {
  removeIgnore(dmChannel);

  dmChannel.send(
    "Because of technical reasons I can only wait 60 seconds for a reaction. I removed the other message to not confuse you. If you need anything from me, just drop me a message!"
  );
  await optionsMessage.delete();
};

export const isOnBreak = async (userId: string) => {
  return await prisma.usersOnBreak.findFirst({ where: { userId } });
};

export const isCooldownDone = async (
  userData: UsersOnBreak
): Promise<boolean> => {
  const twentyFourHours = 24 * 60 * 60 * 1000;
  const userCoolDownTime = userData.addedAt;
  return Date.now() - Number(userCoolDownTime) > twentyFourHours;
};

export const removeIgnore = (channel: DMChannel) => {
  const index = state.ignoredGroupDMs.indexOf(channel.id);
  if (index > -1) {
    state.ignoredGroupDMs.splice(index, 1);
  }
};

export const emojiCollector = async (
  optionsMessage: Message,
  emoji?: string
) => {
  const filter: CollectorFilter<[MessageReaction, User]> = (reaction, user) =>
    allCollectedEmojis.includes(reaction.emoji.name) && !user.bot;

  const reactions = await optionsMessage.awaitReactions({
    filter,
    time: 60000,
    max: 1,
  });
  if (reactions.size === 0) throw "No reactions";

  if (!emoji) return reactions.first();
  return reactions.find((e) => e.emoji.toString() === emoji);
};
