import { Message, VoiceState } from "discord.js";
import VoiceOnDemandTools, {
  voiceOnDemandRequestHostIdentifier,
} from "./common";
import { hasRole } from "../../common/moderator";
import Tools from "../../common/tools";
import {
  Command,
  DiscordEvent,
  CommandHandler,
} from "../../event-distribution";
import prisma from "../../prisma";
import { VoiceStateChange } from "../../event-distribution/events/voice-state-update";
import { TimerService } from "../timer/timer.service";

@Command({
  event: DiscordEvent.MESSAGE,
  trigger: "!voice",
  subTrigger: "host",
  allowedRoles: ["Yes Theory"],
  channelNames: ["bot-commands"],
  description:
    "This handler is to assign another user in your voice channel the host of the room!",
})
class ChangeHostOnDemand implements CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message): Promise<void> {
    const { member } = message;
    const memberVoiceChannel = await VoiceOnDemandTools.getVoiceChannel(member);

    if (!memberVoiceChannel) {
      await Tools.handleUserError(
        message,
        "You don't have a voice channel. You can create one using `!voice create` and an optional limit"
      );
      return;
    }

    const mentionedMember = message.mentions.members.first();
    if (!mentionedMember) {
      await Tools.handleUserError(
        message,
        "You have to mention the user you want to take on ownership of your room."
      );
      return;
    }

    if (mentionedMember.id === message.author.id) {
      await Tools.handleUserError(message, "Errrrr... That's yourself 🤨");
      return;
    }

    const mentionedMemberInVoiceChannel = memberVoiceChannel.members.has(
      mentionedMember.id
    );
    const mentionedMemberHasVoiceChannel =
      await VoiceOnDemandTools.getVoiceChannel(mentionedMember);

    if (mentionedMemberHasVoiceChannel) {
      await Tools.handleUserError(
        message,
        "This user already has a voice channel"
      );
      return;
    }

    if (!mentionedMemberInVoiceChannel) {
      await Tools.handleUserError(
        message,
        "That user is not in your voice channel"
      );
      return;
    }

    if (!hasRole(mentionedMember, "Yes Theory")) {
      await Tools.handleUserError(
        message,
        "That user doesn't have the Yes Theory role required to control the room. Pick someone else or get a Support to give them the Yes Theory role."
      );
      return;
    }

    const mapping = await prisma.voiceOnDemandMapping.findUnique({
      where: { userId: message.author.id },
    });

    await VoiceOnDemandTools.transferOwnership(
      mapping,
      mentionedMember.user,
      memberVoiceChannel
    );

    await message.reply(
      `I transfered ownership of your room to <@${mentionedMember.id}>!`
    );
  }
}

@Command({
  event: DiscordEvent.VOICE_STATE_UPDATE,
  changes: [VoiceStateChange.LEFT, VoiceStateChange.SWITCHED_CHANNEL],
})
class RequestNewHostIfNeeded
  implements CommandHandler<DiscordEvent.VOICE_STATE_UPDATE>
{
  async handle(oldState: VoiceState, newState: VoiceState): Promise<void> {
    if (oldState.channelID === newState.channelID) return;

    const channelId = oldState.channel.id;
    const mapping = await prisma.voiceOnDemandMapping.findUnique({
      where: { channelId },
    });

    if (!mapping) return;
    //We don't care about any other user else than the host leaving, this should avoid spamming the DB
    if (oldState.member.id !== mapping.userId) return;

    if (oldState.channel.members.size === 0) return;

    const executeTime = new Date();
    executeTime.setMinutes(executeTime.getMinutes() + 1);
    await TimerService.createTimer(
      voiceOnDemandRequestHostIdentifier,
      executeTime,
      {
        channelId: channelId,
      }
    );
  }
}
