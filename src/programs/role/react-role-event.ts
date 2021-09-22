import { MessageReaction, User } from "discord.js";
import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../event-distribution";
import prisma from "../../prisma";
import { isColorSelectionMessage } from "../nitro-colors";

@Command({
  event: DiscordEvent.REACTION_ADD,
  emoji: "",
  description: "This",
})
class AddRolesFromReaction
  implements CommandHandler<DiscordEvent.REACTION_ADD>
{
  async handle(reaction: MessageReaction, user: User): Promise<void> {
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

    const guildMember =
      guild.member(user.id) ?? (await guild.members.fetch(user.id));

    if (isColorSelectionMessage(reaction.message.id)) return;
    for (const reactionRole of reactRoleObjects) {
      const roleToAdd = guild.roles.resolve(reactionRole.roleId);
      await guildMember.roles.add(roleToAdd);
    }
  }
}

@Command({
  event: DiscordEvent.REACTION_REMOVE,
  emoji: "",
  description: "This",
})
class RemoveRolesFromReaction
  implements CommandHandler<DiscordEvent.REACTION_REMOVE>
{
  async handle(reaction: MessageReaction, user: User): Promise<void> {
    const {
      message: { id: messageId, channel, guild },
      emoji: { name: emoji },
    } = reaction;

    if (
      channel.type === "dm" ||
      channel.name === "pick-your-color" ||
      user.bot
    ) {
      return;
    }

    const reactRoleObjects = await prisma.reactionRole.findMany({
      where: {
        messageId: messageId,
        channelId: channel.id,
        reaction: emoji,
      },
    });

    reactRoleObjects.forEach((reactionRole) => {
      const guildMember = guild.member(user.id);
      const roleToAdd = guild.roles.resolve(reactionRole.roleId);
      guildMember.roles.remove(roleToAdd);
    });
  }
}
