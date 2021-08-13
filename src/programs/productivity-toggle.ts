import { Command, CommandHandler, DiscordEvent } from "../event-distribution";
import { VoiceState } from "discord.js";
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
class addBreakRoleOnJoin
  implements CommandHandler<DiscordEvent.VOICE_STATE_UPDATE>
{
  async handle(oldState: VoiceState, newState: VoiceState): Promise<void> {
    if (hasRole(newState.member, "Break")) return;
    const channel = newState.channel.name;
    if (
      channel === ChatNames.PRODUCTIVITY ||
      channel === ChatNames.WATCH_ME_WORK ||
      channel === ChatNames.WATCH_ME_WORK_TOO
    ) {
      const guildMember = newState.member;
      const BreakRole = Tools.getRoleByName("Break", newState.guild);
      await guildMember.roles.add(BreakRole);
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
      const guildMember = oldState.member;
      const BreakRole = Tools.getRoleByName("Break", oldState.guild);
      await guildMember.roles.remove(BreakRole);
    }
  }
}
