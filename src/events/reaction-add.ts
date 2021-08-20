import { Message, MessageReaction, PartialUser, User } from "discord.js";
import Tools from "../common/tools";
import { GroupManagerTools, NitroColors } from "../programs";
import { hasRole } from "../common/moderator";
import prisma from "../prisma";

const reactionAdd = async (
  messageReaction: MessageReaction,
  user: User | PartialUser
) => {
  await handleChannelToggleReaction(
    messageReaction.message,
    messageReaction.emoji.name,
    user
  );
  await addRolesFromReaction(messageReaction, user);
};

const addRolesFromReaction = async (
  messageReaction: MessageReaction,
  user: User | PartialUser
) => {
  const {
    message: { id: messageId, channel, guild },
    emoji: { name: emoji },
  } = messageReaction;

  const reactRoleObjects = await prisma.reactionRole.findMany({
    where: {
      messageId: messageId,
      channelId: channel.id,
      reaction: emoji,
    },
  });

  for (const reactionRole of reactRoleObjects) {
    const guildMember =
      guild.member(user.id) ?? (await guild.members.fetch(user.id));
    const roleToAdd = guild.roles.resolve(reactionRole.roleId);

    if (
      NitroColors.isColorSelectionMessage(messageId) &&
      NitroColors.memberHasNitroColor(guildMember)
    ) {
      guildMember
        .createDM()
        .then((dm) =>
          dm.send(
            "You can't assign yourself a new colour yet, please wait until the end of the month!"
          )
        );

      await messageReaction.users.remove(guildMember);
    } else {
      await guildMember.roles.add(roleToAdd);
    }
  }
};

const handleChannelToggleReaction = async (
  message: Message,
  emoji: string,
  user: User | PartialUser
) => {
  const { channel, guild, id: messageId } = message;

  const storedMessage = await prisma.message.findUnique({
    where: { id: messageId },
  });

  if (!storedMessage) {
    // abort if we don't know of a trigger for this message
    return;
  }

  const member = guild.member(user.id);
  // Catch users who are timeouted and deny their attempts at accessing other channels
  if (hasRole(member, "Time Out")) {
    const reaction = message.reactions.cache.find(
      (reaction) => reaction.emoji.name === emoji
    );
    await reaction.users.remove(member);
    return;
  }

  // Make sure we know what channel this message is forever
  if (storedMessage.channel === null) {
    storedMessage.channel = message.channel.id;
    await prisma.message.update({
      data: storedMessage,
      where: { id: storedMessage.id },
    });
    // record what channel this message is in
    await message.react(emoji);
    await GroupManagerTools.backfillReactions(messageId, channel.id, guild);
  }

  await Tools.addPerUserPermissions(emoji, messageId, guild, member);
};

export default reactionAdd;
