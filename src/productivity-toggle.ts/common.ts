import { GuildMember, VoiceChannel } from "discord.js";
import { ChatNames } from "../collections/chat-names";

export const isProdVoiceChannel = (channel: VoiceChannel) => {
  const prodVCNames = [
    ChatNames.PRODUCTIVITY,
    ChatNames.WATCH_ME_WORK,
    ChatNames.WATCH_ME_WORK_TOO,
  ];
  if (channel === null) return false;
  return prodVCNames.includes(channel.name as ChatNames);
};

export const revertProductivityPermissions = async (
  member: GuildMember,
  channel: VoiceChannel
) => {
  const prodVoiceChats = [
    ChatNames.WATCH_ME_WORK,
    ChatNames.WATCH_ME_WORK_TOO,
    ChatNames.PRODUCTIVITY,
    ChatNames.VOICE_CHAT_WIP,
  ];
  for (const chatName of prodVoiceChats) {
    const productivityChannel = channel.guild.channels.cache.find(
      (c) => c.name === chatName
    );
    await productivityChannel.permissionOverwrites.get(member.id).delete();
  }
};

export const createProductivityPermissions = async (
  member: GuildMember,
  channel: VoiceChannel
) => {
  const prodVoiceChats = [
    ChatNames.WATCH_ME_WORK,
    ChatNames.WATCH_ME_WORK_TOO,
    ChatNames.PRODUCTIVITY,
    ChatNames.VOICE_CHAT_WIP,
  ];

  const commonPermissions = {
    VIEW_CHANNEL: true,
    CONNECT: true,
    STREAM: true,
    USE_VAD: true,

    SEND_MESSAGES: true,
    READ_MESSAGE_HISTORY: true,
  };

  for (const chatName of prodVoiceChats) {
    const productivityChannel = channel.guild.channels.cache.find(
      (c) => c.name === chatName
    );

    await productivityChannel.updateOverwrite(member.id, {
      ...commonPermissions,
      SPEAK: chatName !== ChatNames.PRODUCTIVITY,
      STREAM: chatName !== ChatNames.PRODUCTIVITY,
      USE_VAD: chatName !== ChatNames.PRODUCTIVITY,
    });
  }
};
