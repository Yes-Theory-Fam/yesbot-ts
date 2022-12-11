import { AutocompleteHandler } from '../../event-distribution/events/slash-commands/autocomplete';
import prisma from '../../prisma';

export const groupAutocomplete: AutocompleteHandler<number> = async (currentInput) => {
  const groups = await prisma.userGroup.findMany({
    where: {
      name: {
        contains: currentInput,
        mode: 'insensitive'
      }
    },
  });

  return groups.map(g => ({name: g.name, value: g.id}));
};
