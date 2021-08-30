import { Message, MessageReaction, Permissions, User } from "discord.js";

import { hasRole } from "../../common/moderator";
import Tools from "../../common/tools";
import prisma from "../../prisma";
import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../event-distribution";
import { TimerService } from "../timer/timer.service";

const defaultLimit = 5;
const maxLimit = 10;

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
    const requestedLimit = Number(message.content.split(" ")[2]);
    const { guild, member } = message;
    let userLimit = await Tools.handleLimitCommand(
      message,
      requestedLimit,
      maxLimit
    );

    if (!userLimit) {
      userLimit = defaultLimit;
    }

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

    const hasExisting = await Tools.getVoiceChannel(member);

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
      await Tools.getChannelName(message.member, reaction.emoji.name),
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
    const memberVoiceChannel = await Tools.getVoiceChannel(member);

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
    const mentionedMemberHasVoiceChannel = await Tools.getVoiceChannel(
      mentionedMember
    );

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

    await Tools.transferOwnership(
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
  event: DiscordEvent.MESSAGE,
  trigger: "!voice",
  subTrigger: "knock",
  allowedRoles: ["Yes Theory"],
  channelNames: ["bot-commands"],
  description:
    "This handler is for you to be able to knock on a voice channel to gain access to it, if it there is no room!",
})
class KnockOnDemand implements CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message): Promise<void> {
    const owner = message.mentions.users.first();
    if (!owner) {
      return Tools.handleUserError(
        message,
        "You have to ping the user you want to join!"
      );
    }

    const member = message.guild.member(owner);
    const channel = await Tools.getVoiceChannel(member);

    if (!channel) {
      return Tools.handleUserError(
        message,
        "That user doesn't have a channel!"
      );
    }

    if (
      channel.members.some((member) => member.user.id === message.author.id)
    ) {
      return Tools.handleUserError(message, "You just knocked from inside!");
    }

    if (channel.members.size < channel.userLimit) {
      return Tools.handleUserError(
        message,
        "That channel has free space; you can just join!"
      );
    }

    if (channel.members.size === maxLimit) {
      return Tools.handleUserError(
        message,
        "That channel is already at the maximum limit, sorry!"
      );
    }

    const accessMessage = await message.channel.send(
      `<@${owner.id}>, <@${message.author.id}> wants to join your voice channel. Allow?`
    );

    await accessMessage.react("👍");

    const filter = (reaction: MessageReaction, user: User) =>
      user.id === owner.id && reaction.emoji.name === "👍";
    const vote = (
      await accessMessage.awaitReactions(filter, {
        max: 1,
        time: 60000,
      })
    ).first();

    await accessMessage.delete();

    if (!vote) {
      await message.reply(`sorry but ${member.displayName} didn't respond.`);
      return;
    }

    await message.reply("you were let in!");
    const limit = Math.min(maxLimit, channel.userLimit + 1);
    await Tools.updateLimit(channel, limit);
  }
}
