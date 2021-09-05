import { Command, CommandHandler, DiscordEvent } from "../event-distribution";
import { VoiceChannel, VoiceState, Message, GuildMember } from "discord.js";
import { VoiceStateChange } from "../event-distribution/events/voice-state-update";
import { ChatNames } from "../collections/chat-names";
import Tools from "../common/tools";
import { hasRole } from "../common/moderator";

@Command({
  event: DiscordEvent.VOICE_STATE_UPDATE,
  changes: [VoiceStateChange.JOINED, VoiceStateChange.SWITCHED_CHANNEL],
})
class AddBreakRoleOnJoin
  implements CommandHandler<DiscordEvent.VOICE_STATE_UPDATE>
{
  async handle(oldState: VoiceState, newState: VoiceState): Promise<void> {
    if (hasRole(newState.member, "Break")) return;

    const channel = newState.channel;

    if (!isProdVoiceChannel(channel)) return;

    const guildMember = newState.member;
    await createProductivityPermissions(guildMember, channel);

    const breakRole = Tools.getRoleByName("Break", newState.guild);
    await guildMember.roles.add(breakRole);
  }
}

@Command({
  event: DiscordEvent.VOICE_STATE_UPDATE,
  changes: [VoiceStateChange.LEFT],
  description:
    "This handler checks if the user left one of the productivity channels",
})
class RemoveBreakRoleOnLeave
  implements CommandHandler<DiscordEvent.VOICE_STATE_UPDATE>
{
  async handle(oldState: VoiceState, newState: VoiceState): Promise<void> {
    const channel = oldState.channel;

    if (!isProdVoiceChannel(channel)) return;

    const guildMember = oldState.member;
    await revertProductivityPermissions(guildMember, channel);

    const breakRole = Tools.getRoleByName("Break", oldState.guild);
    await guildMember.roles.remove(breakRole);
  }
}

@Command({
  event: DiscordEvent.VOICE_STATE_UPDATE,
  changes: [VoiceStateChange.SWITCHED_CHANNEL],
  description:
    "This handler checks if the user switched between productivity channels or to a different channel",
})
class ChannelSwitchCheck
  implements CommandHandler<DiscordEvent.VOICE_STATE_UPDATE>
{
  async handle(oldState: VoiceState, newState: VoiceState): Promise<void> {
    const oldChannel = oldState.channel;
    const newChannel = newState.channel;
    if (isProdVoiceChannel(oldChannel) && isProdVoiceChannel(newChannel))
      return;

    if (!isProdVoiceChannel(oldChannel) && isProdVoiceChannel(newChannel))
      return;

    if (!isProdVoiceChannel(oldChannel) && !isProdVoiceChannel(newChannel))
      return;

    const guildMember = newState.member;

    await revertProductivityPermissions(guildMember, oldChannel);
  }
}

@Command({
  event: DiscordEvent.MESSAGE,
  trigger: "!toggleProdVC",
  channelNames: [ChatNames.VOICE_CHAT_WIP],
  description:
    "This handler toggles the feature of hiding the channels while in Productivity",
})
class ToggleChannelsInProdVC implements CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message): Promise<void> {
    const guildMember = message.member;

    if (!isProdVoiceChannel(guildMember.voice.channel)) {
      await Tools.handleUserError(
        message,
        "You're not in a productivity voice channel!"
      );
      return;
    }

    if (hasRole(guildMember, "Break")) {
      const breakRole = Tools.getRoleByName("Break", message.guild);
      await guildMember.roles.remove(breakRole);
      return;
    }

    if (!hasRole(guildMember, "Break")) {
      const breakRole = Tools.getRoleByName("Break", message.guild);
      await guildMember.roles.add(breakRole);
      return;
    }
  }
}

const isProdVoiceChannel = (channel: VoiceChannel) => {
  const prodVCNames = [
    ChatNames.PRODUCTIVITY,
    ChatNames.WATCH_ME_WORK,
    ChatNames.WATCH_ME_WORK_TOO,
  ];
  if (channel === null) return;
  return prodVCNames.includes(channel.name as ChatNames);
};

const revertProductivityPermissions = async (
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
    const ProductivityChannels = channel.guild.channels.cache.find(
      (c) => c.name === chatName
    );
    await ProductivityChannels.permissionOverwrites.get(member.id).delete();
  }
};

const createProductivityPermissions = async (
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
    const ProductivityChannel = channel.guild.channels.cache.find(
      (c) => c.name === chatName
    );
    await ProductivityChannel.updateOverwrite(member.id, {
      VIEW_CHANNEL: true,
      CONNECT: true,
      STREAM: true,
      USE_VAD: true,
    });

    if (ProductivityChannel.name === ChatNames.PRODUCTIVITY) {
      await ProductivityChannel.updateOverwrite(member.id, {
        CONNECT: true,
        VIEW_CHANNEL: true,
        SPEAK: false,
      });
    }

    if (ProductivityChannel.name === ChatNames.VOICE_CHAT_WIP) {
      await ProductivityChannel.updateOverwrite(member.id, {
        VIEW_CHANNEL: true,
        SEND_MESSAGES: true,
        READ_MESSAGE_HISTORY: true,
      });
    }
  }
};
