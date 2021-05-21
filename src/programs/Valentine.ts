import {
  Guild,
  GuildChannel,
  GuildMember,
  Message,
  MessageReaction,
  Snowflake,
  TextChannel,
  User,
  VoiceChannel,
  VoiceState,
} from "discord.js";
import { Valentine } from "@yes-theory-fam/database";
import { textLog } from "../common/moderator";
import Timeout = NodeJS.Timeout;
import { createYesBotLogger } from "../log";
import prisma from "../prisma";

const logger = createYesBotLogger("programs", "Valentine");

type MemberPick = { member: GuildMember; valentine: Valentine };

const pickCount = 2;
const signupEmote = "💕";
const signupChannelName = "valentines";
const schedulingTime = 30 * 60 * 1000; // 30 minutes
const timeLimit = 10 * 60 * 1000; // 10 minutes
const voiceChannelName = "Jail Booth";

let timeout: Timeout;
let interval: Timeout;
let currentPicks: MemberPick[] = [];
let originalChannels: VoiceChannel[] = [];
let movedInMessage: Message | null = null;

const getTextChannel = (guild: Guild) =>
  guild.channels.cache
    .filter((c) => c instanceof TextChannel)
    .find((c) => c.name === signupChannelName) as TextChannel;

const isValentineVoice = (channel: GuildChannel | null) =>
  channel &&
  channel instanceof VoiceChannel &&
  channel.name.toLowerCase().endsWith(voiceChannelName.toLowerCase());

const currentPings = () => {
  const pings = currentPicks.map((p) => `<@${p.member.id}>`);
  const anded = pings.pop();
  return `${pings.join(", ")} and ${anded}`;
};

const isReactionRelevant = (reaction: MessageReaction) => {
  const isCorrectChannel =
    reaction.message.channel instanceof GuildChannel &&
    reaction.message.channel.name === signupChannelName;

  const isCorrectEmote = reaction.emoji.name === signupEmote;

  return isCorrectChannel && isCorrectEmote;
};

const pickMembers = async (guild: Guild): Promise<MemberPick[]> => {
  const availableValentines = await prisma.valentine.findMany({
    where: {
      start: {
        not: null,
      },
    },
  });

  const members = availableValentines.map((v) => ({
    valentine: v,
    member: guild.member(v.userId),
  }));
  const availableMembers = members.filter(({ member }) =>
    member.voice.channel?.parent?.name.toLowerCase().endsWith("conversation")
  );

  if (availableMembers.length < pickCount) {
    throw new Error("Not enough members");
  }

  const getRandom = () => Math.floor(Math.random() * availableMembers.length);
  const picks: number[] = [];
  while (picks.length < pickCount) {
    const random = getRandom();
    if (!picks.includes(random)) picks.push(random);
  }

  return picks.map((i) => availableMembers[i]);
};

const endMemberPick = async (mp: MemberPick, vc: VoiceChannel) => {
  await prisma.valentine.update({
    where: { userId: mp.valentine.userId },
    data: { end: new Date() },
  });

  const channelExists = vc.guild.channels.resolve(vc.id);

  const { voice: voiceState } = mp.member;
  try {
    if (channelExists) {
      await voiceState.setChannel(vc);
    } else {
      await voiceState.kick();
    }
  } catch (e) {
    // Very likely because the member wasn't in a voice channel. If not, oops.
  }
};

const lifecycle = async (guild: Guild) => {
  try {
    currentPicks = await pickMembers(guild);
  } catch {
    // If we cannot find enough members, we will just try again in the next interval
    return;
  }

  const message = `${currentPings()} have been moved to the ${voiceChannelName}.
Your 10 minutes to unlock your UwU role start now (you will be moved back to the channels you were picked from automatically once the time runs out)!`;

  movedInMessage = await getTextChannel(guild).send(message);

  const voiceChannel = guild.channels.cache.find(isValentineVoice);

  originalChannels = currentPicks.map(({ member }) => member.voice.channel);
  for (const { member, valentine } of currentPicks) {
    await prisma.valentine.update({
      where: { userId: valentine.userId },
      data: { start: new Date() },
    });

    await member.voice.setChannel(voiceChannel);
  }

  timeout = setTimeout(async () => {
    // We want to run the cleanup as early as possible so we cache the currentPings here
    const pings = currentPings();
    await cleanUp();
    // const role = Tools.getRoleByName("Support", guild);
    // await textLog(
    //   `<@&${role}> Another conversation managed to past the 10 minutes! Please upload the next emote :)`
    // );
    await getTextChannel(guild).send(
      `YES! ${pings} talked for 10 minutes so they unlocked the UwU role!`
    );
  }, timeLimit);
};

const cleanUp = async () => {
  clearTimeout(timeout);
  const shallowPicks = [...currentPicks];
  currentPicks = [];

  if (movedInMessage) {
    try {
      await movedInMessage.delete();
    } catch (err) {
      logger.error(
        "Could not delete movedInMessage; probably already deleted.",
        err
      );
    }
  }

  for (let i = 0; i < shallowPicks.length; i++) {
    await endMemberPick(shallowPicks[i], originalChannels[i]);
  }
};

const setupReaction = async (messageId: Snowflake, guild: Guild) => {
  if (!messageId) {
    return await textLog(
      `Please add the messageId! Ex: !valentine setup 1720397101346`
    );
  }

  const channel = getTextChannel(guild);
  if (!channel) {
    return await textLog(`Could not find channel ${signupChannelName}`);
  }

  if (!(channel instanceof TextChannel)) {
    return await textLog(
      `Channel with name ${signupChannelName} is not a TextChannel`
    );
  }

  const message = await channel.messages.fetch(messageId, false, true);
  await message.react(signupEmote);
  await textLog("Done!");
};

export const changeEventState = async (message: Message) => {
  const split = message.content.split(" ");
  const command = split[1];

  switch (command) {
    case "setup":
      await setupReaction(split[2], message.guild);
      break;
    case "start":
      clearInterval(interval);
      interval = setInterval(() => lifecycle(message.guild), schedulingTime);
      await message.reply("Starting event!");
      await lifecycle(message.guild);
      break;
    case "stop":
      clearInterval(interval);
      interval = null;
      await message.reply(
        "Stopping event! The currently active conversation will end but there won't be a next one (unless started again)!"
      );
      break;
    default:
      await message.reply(
        "Unknown command! Available are `start`, `stop` and `setup`"
      );
  }
};

export const signupReaction = async (reaction: MessageReaction, user: User) => {
  if (!isReactionRelevant(reaction)) {
    return;
  }

  const existingValentine = await prisma.valentine.findUnique({
    where: { userId: user.id },
  });
  if (existingValentine && existingValentine.start) {
    return;
  }

  await prisma.valentine.create({ data: { userId: user.id } });
};

export const signoutReaction = async (
  reaction: MessageReaction,
  user: User
) => {
  if (!isReactionRelevant(reaction)) {
    return;
  }

  await prisma.valentine.delete({ where: { userId: user.id } });
};

export const valentineVoiceState = async (
  oldState: VoiceState,
  newState: VoiceState
) => {
  const memberId = oldState.member.id;
  const activeMemberIds = currentPicks.map(({ member }) => member.id);
  // This listener is not about any members outside of the currently active ones
  if (!activeMemberIds.includes(memberId)) {
    return;
  }

  // Someone disconnected from jail booth!
  if (
    isValentineVoice(oldState.channel) &&
    !isValentineVoice(newState.channel)
  ) {
    await getTextChannel(oldState.guild ?? newState.guild).send(
      `Oh no! The conversation of ${currentPings()} didn't go that well apparently 😉 They couldn't unlock the new emote.`
    );
    await cleanUp();
  }
};
