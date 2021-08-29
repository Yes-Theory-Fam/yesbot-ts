import {
  GuildMember,
  Message,
  MessageReaction,
  Permissions,
  Snowflake,
  TextChannel,
  User,
  VoiceChannel,
  VoiceState,
} from "discord.js";

import { hasRole } from "../common/moderator";
import Tools from "../common/tools";
import prisma from "../prisma";
import { Timer, VoiceOnDemandMapping } from "@yes-theory-fam/database/client";
import { Command, CommandHandler, DiscordEvent } from "../event-distribution";
import bot from "..";
import { VoiceStateChange } from "../event-distribution/events/voice-state-update";
import { TimerService } from "./timer/timer.service";

interface VoiceChannelsTimerData {
  channelId: Snowflake;
}
const defaultLimit = 5;
const maxLimit = 10;

const emojiPool = ["📹", "💬", "📺", "🎲", "🎵", "🏋️"];
const voiceOnDemandCreationIdentifier = "voiceondemandchannelcreation";
const voiceOnDemandRequestHostIdentifier = "voiceondemandrequesthost";

const getChannelName = (m: GuildMember, e: string) =>
  `• ${e} ${m.displayName}'s Room`;

@Command({
  event: DiscordEvent.MESSAGE,
  trigger: "!voice",
  subTrigger: "create",
  channelNames: ["bot-commands"],
  description: "This",
})
class HandleCreateCommand implements CommandHandler<DiscordEvent.MESSAGE> {
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
      getChannelName(message.member, reaction.emoji.name),
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
    await TimerService.createTimer(
      voiceOnDemandCreationIdentifier,
      executeTime,
      {
        channelId: channel.id,
      }
    );
  }
}

@Command({
  event: DiscordEvent.MESSAGE,
  trigger: "!voice",
  subTrigger: "host",
  description: "This",
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

    await transferOwnership(mapping, mentionedMember.user, memberVoiceChannel);

    await message.reply(
      `I transfered ownership of your room to <@${mentionedMember.id}>!`
    );
  }
}

@Command({
  event: DiscordEvent.MESSAGE,
  trigger: "!voice",
  subTrigger: "knock",
  description: "This",
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

@Command({
  event: DiscordEvent.MESSAGE,
  trigger: "!voice",
  subTrigger: "limit",
  channelNames: ["bot-commands"],
  description: "This",
})
class HandleLimitCommand implements CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message): Promise<void> {
    const requestedLimit = Number(message.content.split(" ")[2]);

    const channel = await Tools.getVoiceChannel(message.member);

    if (!channel) {
      await Tools.handleUserError(
        message,
        "You don't have a voice channel. You can create one using `!voice create` and an optional limit"
      );
      return;
    }

    const limit = await Tools.handleLimitCommand(
      message,
      requestedLimit,
      maxLimit
    );

    await Tools.updateLimit(channel, limit);
    await message.reply(
      `Successfully changed the limit of your room to ${limit}`
    );
  }
}

@Command({
  event: DiscordEvent.MESSAGE,
  trigger: "!voice",
  subTrigger: "shrink",
  description: "This",
})
class HandleShrinkLimitCommand implements CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message): Promise<void> {
    const channel = await Tools.getVoiceChannel(message.member);

    if (!channel) {
      await Tools.handleUserError(
        message,
        "You don't have a voice channel. You can create one using `!voice create` and an optional limit"
      );
      return;
    }

    const limit = Math.max(2, channel.members.size);
    await Tools.updateLimit(channel, limit);
    await message.reply(
      `Successfully changed the limit of your room to ${limit}`
    );
  }
}

@Command({
  event: DiscordEvent.MESSAGE,
  trigger: "!voice",
  subTrigger: "up",
  description: "This",
})
class HandleUpLimitCommand implements CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message): Promise<void> {
    const channel = await Tools.getVoiceChannel(message.member);

    if (!channel) {
      await Tools.handleUserError(
        message,
        "You don't have a voice channel. You can create one using `!voice create` and an optional limit"
      );
      return;
    }

    const limit = Math.max(maxLimit, channel.userLimit + 1);
    await Tools.updateLimit(channel, limit);
    await message.reply(
      `Successfully changed the limit of your room to ${limit}`
    );
  }
}

@Command({
  event: DiscordEvent.MESSAGE,
  trigger: "!voice",
  subTrigger: "down",
  description: "This",
})
class HandleDownLimitCommand implements CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message): Promise<void> {
    const channel = message.member.voice.channel;
    const limit = Math.max(2, channel.userLimit - 1);
    await Tools.updateLimit(channel, limit);
  }
}

@Command({
  event: DiscordEvent.TIMER,
  handlerIdentifier: voiceOnDemandCreationIdentifier,
})
class DeleteIfEmpty implements CommandHandler<DiscordEvent.TIMER> {
  async handle(timer: Timer): Promise<void> {
    const data = timer.data as unknown as VoiceChannelsTimerData;
    const channel = bot.channels.resolve(data.channelId) as VoiceChannel;

    if (!channel || !channel.guild.channels.resolve(channel.id)) return;
    if (channel.members.size === 0) {
      await channel.delete();
      await prisma.voiceOnDemandMapping.delete({
        where: { channelId: channel.id },
      });
      return;
    }
    //This is necessary to loop the timer until the channel is deleted
    const executeTime = new Date();
    executeTime.setMinutes(executeTime.getMinutes() + 1);
    await TimerService.createTimer(
      voiceOnDemandCreationIdentifier,
      executeTime,
      {
        channelId: channel.id,
      }
    );
  }
}

@Command({
  event: DiscordEvent.TIMER,
  handlerIdentifier: voiceOnDemandRequestHostIdentifier,
})
class RequestNewHost implements CommandHandler<DiscordEvent.TIMER> {
  async handle(timer: Timer): Promise<void> {
    const data = timer.data as unknown as VoiceChannelsTimerData;
    //We can assume here the channel was deleted because it was empty.
    if (!data) {
      return;
    }

    const channel = bot.channels.resolve(data.channelId) as VoiceChannel;
    const mapping = await prisma.voiceOnDemandMapping.findUnique({
      where: { channelId: channel.id },
    });

    await requestOwnershipTransfer(channel, mapping);
  }
}

@Command({
  event: DiscordEvent.VOICE_STATE_UPDATE,
  changes: [VoiceStateChange.JOINED, VoiceStateChange.SWITCHED_CHANNEL],
})
class VoiceOnDemandPermissions
  implements CommandHandler<DiscordEvent.VOICE_STATE_UPDATE>
{
  async handle(oldState: VoiceState, newState: VoiceState): Promise<void> {
    if (newState.channel.members.size > 1) return;

    const { channel } = newState;
    const { id } = channel;
    const mapping = await prisma.voiceOnDemandMapping.findUnique({
      where: { channelId: id },
    });

    if (!mapping) return;

    const { guild } = channel;

    await channel.updateOverwrite(guild.roles.everyone, {
      STREAM: true,
      CONNECT: null,
    });

    // We no longer need the overwrite for mapping.userId so it is deleted
    channel.permissionOverwrites.get(mapping.userId)?.delete();
  }
}

@Command({
  event: DiscordEvent.VOICE_STATE_UPDATE,
  changes: [VoiceStateChange.LEFT, VoiceStateChange.SWITCHED_CHANNEL],
  description: "This",
})
class RequestNewHostIfNeeded
  implements CommandHandler<DiscordEvent.VOICE_STATE_UPDATE>
{
  async handle(oldState: VoiceState, newState: VoiceState): Promise<void> {
    if (!oldState.channel || oldState.channelID === newState.channelID) return;

    const channelId = oldState.channel.id;
    const mapping = await prisma.voiceOnDemandMapping.findUnique({
      where: { channelId },
    });

    if (!mapping) return;

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

const removeMapping = async (channelId: string) => {
  await prisma.voiceOnDemandMapping.delete({ where: { channelId } });
};

const requestOwnershipTransfer = async (
  channel: BaseGuildVoiceChannel,
  mapping: VoiceOnDemandMapping
) => {
  if (!channel.guild.channels.resolve(channel.id) || channel.members.size === 0)
    return;

  // Gotta fetch the most recent one to make sure potential updates through !voice host are still in here
  const currentMapping = await prisma.voiceOnDemandMapping.findUnique({
    where: { userId: mapping.userId },
  });
  if (!currentMapping) return;

  // Owner is in there
  if (channel.members.some((member) => member.id === currentMapping.userId))
    return;

  const claimEmoji = "☝";
  const requestMessageText = `Hey, the owner of your room left! I need one of you to claim ownership of the room in the next minute, otherwise I'll pick someone randomly. You can claim ownership by clicking the ${claimEmoji}!`;

  // Functions to get the most recent values whenever needed (so you cannot leave the channel and claim ownership)
  const getMemberIds = () => channel.members.map((member) => member.id);
  const getPingAll = () =>
    getMemberIds()
      .map((id) => `<@${id}>`)
      .join(", ") + " ";

  const botCommands = channel.guild.channels.cache.find(
    (channel) => channel.name === "bot-commands"
  ) as TextChannel;
  const transferMessage = await botCommands.send(
    getPingAll() + requestMessageText
  );
  await transferMessage.react(claimEmoji);

  const filter = (reaction: MessageReaction, user: User) =>
    reaction.emoji.name === claimEmoji && getMemberIds().includes(user.id);
  const claim = (
    await transferMessage.awaitReactions({ filter, max: 1, time: 60000 })
  ).first();

  await transferMessage.delete();

  if (getMemberIds().length < 1) {
    return;
  }

  if (!claim) {
    await botCommands.send(
      getPingAll() +
        "None of you claimed ownership of the room so I shall assign someone randomly!"
    );
  }

  const userIdsInChannel = await prisma.voiceOnDemandMapping.findMany({
    select: { userId: true },
    where: { userId: { in: getMemberIds() } },
  }); //rourou

  const allowedUsersListForHost = getMemberIds().filter((memberId) =>
    userIdsInChannel.every((user) => user.userId !== memberId)
  );

  const randomizer =
    allowedUsersListForHost[
      Math.floor(Math.random() * allowedUsersListForHost.length)
    ];

  const claimingUser = claim
    ? claim.users.cache
        .filter((user) => getMemberIds().includes(user.id))
        .first()
    : (await channel.guild.members.fetch(randomizer)).user;

  if (allowedUsersListForHost.length === 0) {
    await botCommands.send(
      getPingAll() +
        `None of you can claim this channel as you already have a channel, it has been deleted!`
    );
    await prisma.voiceOnDemandMapping.delete({
      where: { channelId: channel.id },
    });
    await channel.delete();
    return;
  }

  if (!allowedUsersListForHost.includes(claimingUser.id)) {
    await botCommands.send(
      `<@${claimingUser.id}>, you cannot claim the room as you already have a room so I shall assign someone randomly!`
    );
    const newClaimingUser = (await channel.guild.members.fetch(randomizer))
      .user;

    await botCommands.send(
      `<@${newClaimingUser.id}>, is now the new owner of the room! You can now change the limit of it using \`!voice limit\`.`
    );

    await transferOwnership(currentMapping, newClaimingUser, channel);
    return;
  }

  await botCommands.send(
    `<@${claimingUser.id}>, is now the new owner of the room! You can now change the limit of it using \`!voice limit\`.`
  );

  await transferOwnership(currentMapping, claimingUser, channel);
};

const transferOwnership = async (
  mapping: VoiceOnDemandMapping,
  claimingUser: User,
  channel: BaseGuildVoiceChannel
) => {
  await prisma.voiceOnDemandMapping.update({
    where: { channelId: channel.id },
    data: { userId: claimingUser.id },
  });

  const { emoji } = mapping;
  const newChannelName = getChannelName(
    channel.guild.members.resolve(claimingUser),
    emoji
  );

  await channel.setName(newChannelName);
};
