import { Command, CommandHandler, DiscordEvent } from "../event-distribution";
import { TextChannel, VoiceChannel, VoiceState, Message } from "discord.js";
import { VoiceStateChange } from "../event-distribution/events/voice-state-update";
import { ChatNames } from "../collections/chat-names";
import Tools from "../common/tools";
import { hasRole } from "../common/moderator";

@Command({
  event: DiscordEvent.VOICE_STATE_UPDATE,
  changes: [VoiceStateChange.JOINED, VoiceStateChange.SWITCHED_CHANNEL],
  description:
    "This handler checks if the user left one of the productivity channels",
})
class AddBreakRoleOnJoin
  implements CommandHandler<DiscordEvent.VOICE_STATE_UPDATE>
{
  async handle(oldState: VoiceState, newState: VoiceState): Promise<void> {
    if (hasRole(newState.member, "Break")) return;

    const channel = newState.channel;

    if (
      channel === null ||
      (channel.name != ChatNames.PRODUCTIVITY &&
        channel.name != ChatNames.WATCH_ME_WORK &&
        channel.name != ChatNames.WATCH_ME_WORK_TOO)
    )
      return;

    const channelName = channel.name;

    if (
      channelName === ChatNames.PRODUCTIVITY ||
      channelName === ChatNames.WATCH_ME_WORK ||
      channelName === ChatNames.WATCH_ME_WORK_TOO
    ) {
      const watchMeWorkChannel = newState.guild.channels.cache.find(
        (channel) => channel.name === ChatNames.WATCH_ME_WORK
      ) as VoiceChannel;
      const watchMeWorkTooChannel = newState.guild.channels.cache.find(
        (channel) => channel.name === ChatNames.WATCH_ME_WORK_TOO
      ) as VoiceChannel;
      const ProductivityChannel = newState.guild.channels.cache.find(
        (channel) => channel.name === ChatNames.PRODUCTIVITY
      ) as VoiceChannel;
      const voiceChatWIPChannel = newState.guild.channels.cache.find(
        (channel) => channel.name === ChatNames.VOICE_CHAT_WIP
      ) as TextChannel;

      const guildMember = newState.member;

      await watchMeWorkChannel.updateOverwrite(guildMember.id, {
        VIEW_CHANNEL: true,
        CONNECT: true,
        STREAM: true,
        USE_VAD: true,
      });
      await watchMeWorkTooChannel.updateOverwrite(guildMember.id, {
        VIEW_CHANNEL: true,
        CONNECT: true,
        STREAM: true,
        USE_VAD: true,
      });
      await ProductivityChannel.updateOverwrite(guildMember.id, {
        CONNECT: true,
        VIEW_CHANNEL: true,
        SPEAK: false,
      });
      await voiceChatWIPChannel.updateOverwrite(guildMember.id, {
        VIEW_CHANNEL: true,
        SEND_MESSAGES: true,
        READ_MESSAGE_HISTORY: true,
      });

      const breakRole = Tools.getRoleByName("Break", newState.guild);
      await guildMember.roles.add(breakRole);
    }
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
    const channel = oldState.channel.name;

    if (
      channel === ChatNames.PRODUCTIVITY ||
      channel === ChatNames.WATCH_ME_WORK ||
      channel === ChatNames.WATCH_ME_WORK_TOO
    ) {
      const watchMeWorkChannel = oldState.guild.channels.cache.find(
        (channel) => channel.name === ChatNames.WATCH_ME_WORK
      ) as VoiceChannel;
      const watchMeWorkTooChannel = oldState.guild.channels.cache.find(
        (channel) => channel.name === ChatNames.WATCH_ME_WORK_TOO
      ) as VoiceChannel;
      const ProductivityChannel = oldState.guild.channels.cache.find(
        (channel) => channel.name === ChatNames.PRODUCTIVITY
      ) as VoiceChannel;
      const voiceChatWIPChannel = oldState.guild.channels.cache.find(
        (channel) => channel.name === ChatNames.VOICE_CHAT_WIP
      ) as TextChannel;

      const guildMember = oldState.member;

      const breakRole = Tools.getRoleByName("Break", oldState.guild);
      await guildMember.roles.remove(breakRole);

      await watchMeWorkChannel.permissionOverwrites
        .get(guildMember.id)
        .delete();
      await watchMeWorkTooChannel.permissionOverwrites
        .get(guildMember.id)
        .delete();
      await ProductivityChannel.permissionOverwrites
        .get(guildMember.id)
        .delete();
      await voiceChatWIPChannel.permissionOverwrites
        .get(guildMember.id)
        .delete();

      return;
    }
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
    const oldChannelName = oldState.channel.name;
    const newChannelName = newState.channel.name;

    if (
      ((oldChannelName === ChatNames.PRODUCTIVITY ||
        oldChannelName === ChatNames.WATCH_ME_WORK ||
        oldChannelName === ChatNames.WATCH_ME_WORK_TOO) &&
        newChannelName === ChatNames.PRODUCTIVITY) ||
      newChannelName === ChatNames.WATCH_ME_WORK ||
      newChannelName === ChatNames.WATCH_ME_WORK_TOO
    )
      return;

    const watchMeWorkChannel = oldState.guild.channels.cache.find(
      (channel) => channel.name === ChatNames.WATCH_ME_WORK
    ) as VoiceChannel;
    const watchMeWorkTooChannel = oldState.guild.channels.cache.find(
      (channel) => channel.name === ChatNames.WATCH_ME_WORK_TOO
    ) as VoiceChannel;
    const ProductivityChannel = oldState.guild.channels.cache.find(
      (channel) => channel.name === ChatNames.PRODUCTIVITY
    ) as VoiceChannel;
    const voiceChatWIPChannel = oldState.guild.channels.cache.find(
      (channel) => channel.name === ChatNames.VOICE_CHAT_WIP
    ) as TextChannel;

    const guildMember = newState.member;

    await watchMeWorkChannel.permissionOverwrites.get(guildMember.id).delete();
    await watchMeWorkTooChannel.permissionOverwrites
      .get(guildMember.id)
      .delete();
    await ProductivityChannel.permissionOverwrites.get(guildMember.id).delete();
    await voiceChatWIPChannel.permissionOverwrites.get(guildMember.id).delete();
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

    if (
      guildMember.voice.channel === null ||
      (guildMember.voice.channel.name != ChatNames.WATCH_ME_WORK &&
        guildMember.voice.channel.name != ChatNames.WATCH_ME_WORK_TOO &&
        guildMember.voice.channel.name != ChatNames.PRODUCTIVITY)
    ) {
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
