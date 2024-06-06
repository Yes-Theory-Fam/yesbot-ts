import { MessageReaction, User } from "discord.js";
import {
  Command,
  CommandHandler,
  DiscordEvent,
  EventLocation,
} from "../../event-distribution/index.js";
import prisma from "../../prisma.js";
import { isColorSelectionMessage } from "../nitro-colors/index.js";

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
        reaction: emoji ?? undefined,
      },
    });

    if (!reactRoleObjects) return;

    const guildMember =
      guild?.members.resolve(user.id) ?? (await guild?.members.fetch(user.id));

    for (const reactionRole of reactRoleObjects) {
      const roleToAdd = guild?.roles.resolve(reactionRole.roleId);
      if (roleToAdd) {
        await guildMember?.roles.add(roleToAdd);
      }
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
        reaction: emoji ?? undefined,
      },
    });

    if (!reactRoleObjects) return;

    reactRoleObjects.forEach((reactionRole) => {
      const guildMember = guild?.members.resolve(user.id);
      const roleToRemove = guild?.roles.resolve(reactionRole.roleId);
      if (roleToRemove) {
        guildMember?.roles.remove(roleToRemove);
      }
    });
  }
}
