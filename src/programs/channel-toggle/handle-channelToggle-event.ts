import {
  BaseGuildVoiceChannel,
  GuildBasedChannel,
  MessageReaction,
  TextChannel,
  User,
  VoiceChannel,
} from "discord.js";
import { hasRole, textLog } from "../../common/moderator";
import Tools from "../../common/tools";
import {
  Command,
  CommandHandler,
  DiscordEvent,
  EventLocation,
} from "../../event-distribution";
import prisma from "../../prisma";
import { backfillReactions } from "./common";

@Command({
  event: DiscordEvent.REACTION_ADD,
  location: EventLocation.SERVER,
  emoji: "",
  description:
    "This handler is to remove user permissions from the channel toggle",
})
class HandleChannelToggleReactionAdd
  implements CommandHandler<DiscordEvent.REACTION_ADD>
{
  async handle(reaction: MessageReaction, user: User): Promise<void> {
    if (user.bot) return;

    const message = reaction.message;
    const emoji = reaction.emoji.toString();

    const { channel, guild, id: messageId } = reaction.message;

    const storedMessage = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!storedMessage) {
      // abort if we don't know of a trigger for this message
      return;
    }

    const member = guild.members.resolve(user.id);
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
      await backfillReactions(messageId, channel.id, guild);
    }

    await Tools.addPerUserPermissions(emoji, messageId, guild, member);
  }
}

@Command({
  event: DiscordEvent.REACTION_REMOVE,
  location: EventLocation.SERVER,
  emoji: "",
  description:
    "This handler is to remove user permissions from the channel toggle",
})
class HandleChannelToggleReactionRemove
  implements CommandHandler<DiscordEvent.REACTION_REMOVE>
{
  async handle(reaction: MessageReaction, user: User): Promise<void> {
    if (user.bot) return;

    const { id: messageId, guild } = reaction.message;
    const emoji = reaction.emoji.toString();

    const toggle = await prisma.channelToggle.findFirst({
      where: {
        emoji,
        messageId,
      },
    });

    if (!toggle) {
      return;
    }

    const channel = guild.channels.cache.find(
      (c): c is TextChannel | VoiceChannel => c.id === toggle.channel
    );

    if (!channel) {
      await textLog(
        `I can't find this channel <#${toggle.channel}>. Has it been deleted?`
      );
      return;
    }

    await channel.permissionOverwrites.resolve(user.id)?.delete();
  }
}
