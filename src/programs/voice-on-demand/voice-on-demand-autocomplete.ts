import { AutocompleteHandler } from "../../event-distribution/events/slash-commands/autocomplete.js";
import prisma from "../../prisma.js";

export const voiceOnDemandAutocomplete: AutocompleteHandler<string> = async (
  currentInput,
  interaction
) => {
  const guild = interaction.guild!;

  const userMappings = await prisma.voiceOnDemandMapping.findMany({
    select: { userId: true },
  });

  const userIds = userMappings.map((m) => m.userId);
  const memberPromises = userIds.map((id) => guild.members.fetch(id));
  const members = await Promise.all(memberPromises);

  const query = currentInput.toLowerCase();
  const matchingMembers = members.filter(
    (m) =>
      m.user.username.toLowerCase().includes(query) ||
      m.displayName.toLowerCase().includes(query)
  );

  matchingMembers.sort((a, b) => a.displayName.localeCompare(b.displayName));

  return matchingMembers
    .map((m) => ({ name: m.displayName, value: m.id }))
    .slice(0, 25);
};
