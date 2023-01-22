import { ReactionRole } from "@prisma/client";
import { Guild } from "discord.js";
import { AutocompleteHandler } from "../../event-distribution/events/slash-commands/autocomplete";
import prisma from "../../prisma";

export const reactRoleAutocomplete: AutocompleteHandler<number> = async (
  currentInput,
  interaction
) => {
  if (!currentInput) {
    const allOptions = await prisma.reactionRole.findMany();
    return allOptions.map((o) =>
      reactionRoleToSelection(o, interaction.guild!)
    );
  }

  const possibleRoleIds = interaction
    .guild!.roles.cache.filter((r) =>
      r.name.toLowerCase().includes(currentInput.toLowerCase())
    )
    .map((r) => r.id);

  const possibleChannelIds = interaction
    .guild!.channels.cache.filter((c) =>
      c.name.toLowerCase().includes(currentInput.toLowerCase())
    )
    .map((c) => c.id);

  const options = await prisma.reactionRole.findMany({
    where: {
      OR: [
        { roleId: { in: possibleRoleIds } },
        { channelId: { in: possibleChannelIds } },
        { reaction: currentInput },
      ],
    },
  });

  return options.map((o) => reactionRoleToSelection(o, interaction.guild!));
};

const reactionRoleToSelection = (reactionRole: ReactionRole, guild: Guild) => {
  const channelName = guild.channels.resolve(reactionRole.channelId)?.name;
  const roleName = guild.roles.resolve(reactionRole.roleId)?.name;

  return {
    name: `${reactionRole.reaction} in #${channelName} for ${roleName}`,
    value: reactionRole.id,
  };
};
