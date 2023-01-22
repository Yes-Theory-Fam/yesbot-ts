import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
} from "discord.js";
import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../../event-distribution";
import prisma from "../../../prisma";
import { logger } from "../common";
import { groupAutocomplete } from "../group-autocomplete";
import { GroupService } from "../group-service";

enum Errors {
  GROUP_NOT_FOUND = "GROUP_NOT_FOUND",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

@Command({
  event: DiscordEvent.SLASH_COMMAND,
  root: "group-mod",
  subCommand: "change-description",
  description: "Change a group's description",
  options: [
    {
      name: "group",
      type: ApplicationCommandOptionType.Integer,
      autocomplete: groupAutocomplete,
      description: "The group the description shall be changed of",
      required: true,
    },
    {
      name: "description",
      type: ApplicationCommandOptionType.String,
      description: "The new description for the group",
      required: true,
    },
  ],
  errors: {
    [Errors.GROUP_NOT_FOUND]: "That group doesn't exist!",
    [Errors.UNKNOWN_ERROR]: "Failed to update description!",
  },
})
class GroupChangeDescription
  implements CommandHandler<DiscordEvent.SLASH_COMMAND>
{
  async handle(interaction: ChatInputCommandInteraction): Promise<void> {
    const groupId = interaction.options.getInteger("group")!;
    const description = interaction.options.getString("description")!;

    const groupService = new GroupService();
    const group = await groupService.getGroupById(groupId);

    if (!group) {
      throw new Error(Errors.GROUP_NOT_FOUND);
    }

    const previousDescription = group.description;

    try {
      await prisma.userGroup.update({
        where: { id: group.id },
        data: { description },
      });
    } catch (error) {
      logger.error("Failed to update group description, ", error);
      throw new Error(Errors.UNKNOWN_ERROR);
    }

    await interaction.reply(
      `Successfully updated group description from \n> ${previousDescription} \nto \n> ${description}`
    );
  }
}
