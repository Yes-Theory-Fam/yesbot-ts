import { Message } from "discord.js";
import VoiceOnDemandTools from "./common";
import { hasRole } from "../../common/moderator";
import Tools from "../../common/tools";
import {
  Command,
  DiscordEvent,
  CommandHandler,
} from "../../event-distribution";
import prisma from "../../prisma";

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
