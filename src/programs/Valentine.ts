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
const signupChannelName = "valentines";
const schedulingTime = 30 * 60 * 1000; // 30 minutes
const timeLimit = 0.1 * 60 * 1000; // 10 minutes
const voiceChannelName = "Jail Booth";

let timeout: Timeout;
let currentPicks: MemberPick[] = [];
let originalChannels: VoiceChannel[] = [];
let movedInMessage: Message | null = null;

let running = false;

const getTextChannel = (guild: Guild) =>
  guild.channels.cache
    .filter((c) => c instanceof TextChannel)
    .find((c) => c.name === signupChannelName) as TextChannel;

const isValentineVoice = (channel: GuildChannel | null) =>
  channel &&
  channel instanceof VoiceChannel &&
  channel.name.toLowerCase().endsWith(voiceChannelName.toLowerCase());

const currentPings = () => {
  const shallow = [...currentPicks];
  const anded = shallow.pop();
  return `${shallow.join(", ")} and ${anded}`;
};

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
  const availableMembers = members.filter(({ member }) =>
    member.voice.channel?.parent?.name.toLowerCase().endsWith("conversation")
  );

  // TODO: Remove test for only picking people from conversation
  console.log(availableMembers);

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
      if (currentPicks.length > 0) {
        await textLog(
          "@Support Another conversation managed to past the 10 minutes! Please upload the next emote :)"
        );
        await getTextChannel(guild).send(
          `YES! ${currentPings()} talked for 10 minutes so a new emote is unlocked!`
        );
      }
      await setupNextLifecycle(guild);
    }, timeLimit);
  };

  try {
    currentPicks = await pickMembers(guild);
  } catch {
    scheduleNextCycle();
    return;
  }

  const message = `${currentPings()} have been moved to the ${voiceChannelName}. If they can maintain a conversation for 10 minutes, they can unlock a new emote!
The 10 minutes start now (you will be moved back to the channels you were picked from automatically once the time runs out)!`;

  movedInMessage = await getTextChannel(guild).send(message);

  const voiceChannel = guild.channels.cache.find(isValentineVoice);

  originalChannels = currentPicks.map(({ member }) => member.voice.channel);
  for (const { member, valentine } of currentPicks) {
    valentine.start = new Date();
    await valentine.save();
    await member.voice.setChannel(voiceChannel);
  }

  scheduleNextCycle();
};

const setupNextLifecycle = async (guild: Guild) => {
  clearTimeout(timeout);

  if (movedInMessage) {
    await movedInMessage.delete();
  }

  for (let i = 0; i < currentPicks.length; i++) {
    await endMemberPick(currentPicks[i], originalChannels[i]);
  }
  currentPicks = [];

  await lifecycle(guild);
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

  // Someone disconnected from jail booth!
  if (
    isValentineVoice(oldState.channel) &&
    !isValentineVoice(newState.channel)
  ) {
    await getTextChannel(oldState.guild ?? newState.guild).send(
      `Oh no! The conversation of ${currentPings()} didn't go that well apparently! They couldn't unlock the new emote.`
    );
    await setupNextLifecycle(oldState.channel.guild);
  }
};
