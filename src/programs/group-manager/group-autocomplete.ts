import { AutocompleteHandler } from "../../event-distribution/events/slash-commands/autocomplete.js";
import prisma from "../../prisma.js";

// TODO expand autocomplete to accommodate for stuff like "All groups a certain user is not in" or "All groups a certain user IS in"

export const groupAutocomplete: AutocompleteHandler<number> = async (
  currentInput
) => {
  const groups = await prisma.userGroup.findMany({
    where: {
      name: {
        contains: currentInput,
        mode: "insensitive",
      },
    },
  });

  return groups.map((g) => ({ name: g.name, value: g.id })).slice(0, 25);
};
