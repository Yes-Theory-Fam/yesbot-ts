import { ApplicationCommandOptionType } from "discord-api-types/payloads/v10";
import {
  ApplicationCommandOptionChoiceData,
  AutocompleteInteraction,
  ChatInputCommandInteraction,
} from "discord.js";
import { Command, CommandHandler, DiscordEvent } from "../event-distribution";
import { AutocompleteHandler } from "../event-distribution/events/slash-commands/autocomplete";
import prisma from "../prisma";

const groupnameAutocomplete: AutocompleteHandler<number> = async (
  currentValue
) => {
  const options = await prisma.userGroup.findMany({
    select: { id: true, name: true },
    where: {
      name: {
        contains: currentValue?.toString(),
        mode: "insensitive",
      },
    },
    take: 10,
    orderBy: {
      userGroupMembersGroupMembers: {
        _count: "desc",
      },
    },
  });

  return options.map(({ id, name }) => ({
    value: id,
    name,
  }));
};

@Command({
  event: DiscordEvent.SLASH_COMMAND,
  root: "group",
  subCommand: "join",
  options: [
    {
      type: ApplicationCommandOptionType.Integer,
      name: "name",
      description: "The name of the group you want to join",
      autocomplete: groupnameAutocomplete,
    },
  ],
  description: "Allows you to join a group!",
})
class GroupJoinCommand extends CommandHandler<DiscordEvent.SLASH_COMMAND> {
  async handle(interaction: ChatInputCommandInteraction): Promise<void> {
    console.log(interaction.options.getString("name"));
  }
}
