import { MessageReaction, User } from "discord.js";
import {
  Command,
  CommandHandler,
  DiscordEvent,
  EventLocation,
} from "../../event-distribution";
import prisma from "../../prisma";
import { isColorSelectionMessage } from "../nitro-colors";

@Command({
  event: DiscordEvent.REACTION_ADD,
  location: EventLocation.SERVER,
  emoji: "",
  description:
    "This handler is to give the specified role of the roleReaction to the user",
})
class AddRolesFromReaction
  implements CommandHandler<DiscordEvent.REACTION_ADD>
{
  async handle(reaction: MessageReaction, user: User): Promise<void> {
    if (isColorSelectionMessage(reaction.message.id) || user.bot) return;

    const {
      message: { id: messageId, channel, guild },
      emoji: { name: emoji },
    } = reaction;

    const reactRoleObjects = await prisma.reactionRole.findMany({
      where: {
        messageId: messageId,
        channelId: channel.id,
        reaction: emoji,
      },
    });

    if (!reactRoleObjects) return;

    const guildMember =
      guild.member(user.id) ?? (await guild.members.fetch(user.id));

    for (const reactionRole of reactRoleObjects) {
      const roleToAdd = guild.roles.resolve(reactionRole.roleId);
      await guildMember.roles.add(roleToAdd);
    }
  }
}

@Command({
  event: DiscordEvent.REACTION_REMOVE,
  location: EventLocation.SERVER,
  emoji: "",
  description:
    "This handler is to remove the specified role of the roleReaction to the user",
})
class RemoveRolesFromReaction
  implements CommandHandler<DiscordEvent.REACTION_REMOVE>
{
  async handle(reaction: MessageReaction, user: User): Promise<void> {
    if (isColorSelectionMessage(reaction.message.id) || user.bot) return;

    const {
      message: { id: messageId, channel, guild },
      emoji: { name: emoji },
    } = reaction;

    const reactRoleObjects = await prisma.reactionRole.findMany({
      where: {
        messageId: messageId,
        channelId: channel.id,
        reaction: emoji,
      },
    });

    if (!reactRoleObjects) return;

    reactRoleObjects.forEach((reactionRole) => {
      const guildMember = guild.member(user.id);
      const roleToRemove = guild.roles.resolve(reactionRole.roleId);
      guildMember.roles.remove(roleToRemove);
    });
  }
}
