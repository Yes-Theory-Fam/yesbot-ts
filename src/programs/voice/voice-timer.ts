import {
  MessageReaction,
  Snowflake,
  TextChannel,
  User,
  VoiceChannel,
  VoiceState,
} from "discord.js";
import prisma from "../../prisma";
import { Timer, VoiceOnDemandMapping } from "@yes-theory-fam/database/client";
import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../event-distribution";
import bot from "../..";
import { TimerService } from "../timer/timer.service";
import { VoiceStateChange } from "../../event-distribution/events/voice-state-update";
import VoiceOnDemandTools, {
  voiceOnDemandRequestHostIdentifier,
} from "./common";

interface VoiceChannelsTimerData {
  channelId: Snowflake;
}

const voiceOnDemandDeleteIdentifier = "voiceondemandchanneldelete";

@Command({
  event: DiscordEvent.TIMER,
  handlerIdentifier: voiceOnDemandDeleteIdentifier,
})
class DeleteIfEmpty implements CommandHandler<DiscordEvent.TIMER> {
  async handle(timer: Timer): Promise<void> {
    const data = timer.data as unknown as VoiceChannelsTimerData;
    const channel = bot.channels.resolve(data.channelId) as VoiceChannel;
    const mapping = await prisma.voiceOnDemandMapping.findUnique({
      where: {
        channelId: data.channelId,
      },
    });

    if (mapping && !channel) {
      await VoiceOnDemandTools.removeMapping(data.channelId);
      return;
    }

    if (!channel || !channel.guild.channels.resolve(channel.id)) return;

    if (channel.members.size === 0) {
      await channel.delete();
      await VoiceOnDemandTools.removeMapping(channel.id);
      return;
    }
    //In case a user joins after the timer for deleting a channel was started this will transfer the host to them (this is unique only while the bot is down)
    if (
      channel.members.size > 1 &&
      channel.members.every((member) => member.id !== mapping.userId)
    ) {
      await requestOwnershipTransfer(channel, mapping);
      return;
    }
  }
}

@Command({
  event: DiscordEvent.VOICE_STATE_UPDATE,
  changes: [VoiceStateChange.LEFT, VoiceStateChange.SWITCHED_CHANNEL],
})
class StartDeleteIfEmptyTimer
  implements CommandHandler<DiscordEvent.VOICE_STATE_UPDATE>
{
  async handle(oldState: VoiceState, newState: VoiceState): Promise<void> {
    const mapping = await prisma.voiceOnDemandMapping.findUnique({
      where: {
        channelId: oldState.channel.id,
      },
    });
    if (oldState.channel.members.size === 0 && mapping) {
      const channel = oldState.channel;
      const executeTime = new Date();
      executeTime.setMinutes(executeTime.getMinutes() + 1);
      await TimerService.createTimer(
        voiceOnDemandDeleteIdentifier,
        executeTime,
        {
          channelId: channel.id,
        }
      );
      return;
    }
  }
}

@Command({
  event: DiscordEvent.TIMER,
  handlerIdentifier: voiceOnDemandRequestHostIdentifier,
})
class RequestNewHost implements CommandHandler<DiscordEvent.TIMER> {
  async handle(timer: Timer): Promise<void> {
    const data = timer.data as unknown as VoiceChannelsTimerData;
    const channel = bot.channels.resolve(data.channelId) as VoiceChannel;

    //We can assume here the channel was deleted because it was empty.
    if (!channel) return;

    const mapping = await prisma.voiceOnDemandMapping.findUnique({
      where: { channelId: channel.id },
    });

    await requestOwnershipTransfer(channel, mapping);
  }
}

const requestOwnershipTransfer = async (
  channel: VoiceChannel,
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
    await transferMessage.awaitReactions(filter, {
      max: 1,
      time: 60000,
    })
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

    await VoiceOnDemandTools.transferOwnership(
      currentMapping,
      newClaimingUser,
      channel
    );
    return;
  }

  await botCommands.send(
    `<@${claimingUser.id}>, is now the new owner of the room! You can now change the limit of it using \`!voice limit\`.`
  );

  await VoiceOnDemandTools.transferOwnership(
    currentMapping,
    claimingUser,
    channel
  );
};
