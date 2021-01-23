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
import { Valentine } from "../entities/Valentine";
import { IsNull } from "typeorm";
import Timeout = NodeJS.Timeout;
import { textLog } from "../common/moderator";

type MemberPick = { member: GuildMember; valentine: Valentine };

const pickCount = 2;
const signupEmote = "💕";
const signupChannelName = "valentine";
const timeLimit = 10 * 60 * 60 * 1000; // 10 minutes
const voiceChannelName = "jail";

let timeout: Timeout;
let currentPicks: MemberPick[];
let originalChannels: VoiceChannel[];

let running = false;

const isReactionRelevant = (reaction: MessageReaction) => {
  const isCorrectChannel =
    reaction.message.channel instanceof GuildChannel &&
    reaction.message.channel.name === signupChannelName;

  const isCorrectEmote = reaction.emoji.name === signupEmote;

  return isCorrectChannel && isCorrectEmote;
};

const pickMembers = async (guild: Guild): Promise<MemberPick[]> => {
  const availableValentines = await Valentine.find({
    where: {
      start: IsNull(),
    },
  });

  const members = availableValentines.map((v) => ({
    valentine: v,
    member: guild.member(v.userId),
  }));
  const availableMembers = members.filter(({ member }) => member.voice.channel);

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
  mp.valentine.end = new Date();
  await mp.valentine.save();

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
  const scheduleNextCycle = () => {
    timeout = setTimeout(async () => {
      await setupNextLifecycle(guild);
    }, timeLimit);
  };

  let targets;
  try {
    targets = await pickMembers(guild);
  } catch {
    scheduleNextCycle();
    return;
  }

  const voiceChannel = guild.channels.cache
    .filter((c) => c instanceof VoiceChannel)
    .find((c) => c.name === voiceChannelName);

  currentPicks = targets;

  originalChannels = targets.map(({ member }) => member.voice.channel);
  for (const { member, valentine } of targets) {
    valentine.start = new Date();
    await valentine.save();
    await member.voice.setChannel(voiceChannel);
  }

  scheduleNextCycle();
};

const setupNextLifecycle = async (guild: Guild) => {
  currentPicks = [];
  clearTimeout(timeout);

  for (let i = 0; i < currentPicks.length; i++) {
    await endMemberPick(currentPicks[i], originalChannels[i]);
  }

  await lifecycle(guild);
};

const setupReaction = async (messageId: Snowflake, guild: Guild) => {
  if (!messageId) {
    return await textLog(
      `Please add the messageId! Ex: !valentine setup 1720397101346`
    );
  }

  const channel = guild.channels.cache.find(
    (c) => c.name === signupChannelName
  );
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

export const changeEventState = (message: Message) => {
  const split = message.content.split(" ");
  const command = split[1];

  switch (command) {
    case "setup":
      setupReaction(split[2], message.guild);
      break;
    case "start":
      running = true;
      message.reply("Starting event!");
      lifecycle(message.guild);
      break;
    case "stop":
      running = false;
      message.reply(
        "Stopping event! The currently active conversation will end but there won't be a next one (unless started again)!"
      );
      break;
    default:
      message.reply(
        "Unknown command! Available are `start`, `stop` and `setup`"
      );
  }
};

export const signupReaction = async (reaction: MessageReaction, user: User) => {
  if (!isReactionRelevant(reaction)) {
    return;
  }

  const existingValentine = await Valentine.findOne(user.id);
  if (existingValentine && existingValentine.start) {
    return;
  }

  const valentine = new Valentine();
  valentine.userId = user.id;
  await valentine.save();
};

export const signoutReaction = async (
  reaction: MessageReaction,
  user: User
) => {
  if (!isReactionRelevant(reaction)) {
    return;
  }

  await Valentine.delete({
    userId: user.id,
    start: IsNull(),
  });
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

  // Someone isconnected from jail booth!
  if (
    oldState.channel?.name === voiceChannelName &&
    newState.channel?.name !== voiceChannelName
  ) {
    await setupNextLifecycle(oldState.channel.guild);
  }
};
