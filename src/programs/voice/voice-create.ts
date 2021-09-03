import { Message, Permissions } from "discord.js";
import Tools from "../../common/tools";
import prisma from "../../prisma";
import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../event-distribution";
import { TimerService } from "../timer/timer.service";
import VoiceOnDemandTools from "./common";

const emojiPool = ["📹", "💬", "📺", "🎲", "🎵", "🏋️"];
const voiceOnDemandDeleteIdentifier = "voiceondemandchanneldelete";

@Command({
  event: DiscordEvent.MESSAGE,
  trigger: "!voice",
  subTrigger: "create",
  allowedRoles: ["Yes Theory"],
  channelNames: ["bot-commands"],
  description:
    "This handler is to create a voice channel of a maximum of 10 users.",
})
class CreateOnDemand implements CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message): Promise<void> {
    const requestedLimit = message.content.split(" ")[2];
    const { guild, member } = message;
    const userLimit = await VoiceOnDemandTools.handleLimitCommand(
      message,
      requestedLimit,
      true
    );
    if (!userLimit) return;

    let reaction;

    try {
      reaction = await Tools.createVoteMessage(
        message,
        "Which emote would you like to have for your channel?",
        emojiPool,
        true
      );
    } catch {
      return;
    }

    const hasExisting = await VoiceOnDemandTools.getVoiceChannel(member);

    if (hasExisting) {
      await Tools.handleUserError(
        message,
        "You already have an existing voice channel!"
      );
      return;
    }

    const parent = guild.channels.cache.find(
      (channel) =>
        channel.name.toLowerCase().includes("conversation") &&
        channel.type === "category"
    );

    const channel = await guild.channels.create(
      await VoiceOnDemandTools.getChannelName(
        message.member,
        reaction.emoji.name
      ),
      {
        type: "voice",
        parent,
        userLimit,
      }
    );

    const mapping = {
      userId: member.id,
      channelId: channel.id,
      emoji: reaction.emoji.name,
    };
    await prisma.voiceOnDemandMapping.create({ data: mapping });

    await message.reply(
      `Your room was created with a limit of ${userLimit}, have fun! Don't forget, this channel will be deleted if there is noone in it. :smile:`
    );

    const timeoutRole = Tools.getRoleByName("Time Out", guild);
    const breakRole = Tools.getRoleByName("Break", guild);

    await channel.updateOverwrite(guild.roles.everyone, { STREAM: true });
    await channel.overwritePermissions([
      {
        id: guild.roles.everyone,
        allow: [],
        deny: [Permissions.FLAGS.CONNECT],
        type: "role",
      },
      {
        id: timeoutRole.id,
        deny: [Permissions.FLAGS.CONNECT],
        type: "role",
      },
      {
        id: breakRole.id,
        deny: [Permissions.FLAGS.VIEW_CHANNEL],
        type: "role",
      },
      {
        id: member.id,
        allow: [Permissions.FLAGS.CONNECT],
        deny: [],
        type: "member",
      },
    ]);

    const executeTime = new Date();
    executeTime.setMinutes(executeTime.getMinutes() + 1);
    await TimerService.createTimer(voiceOnDemandDeleteIdentifier, executeTime, {
      channelId: channel.id,
    });
  }
}
