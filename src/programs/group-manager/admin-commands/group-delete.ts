import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
} from "discord.js";
import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../../event-distribution/index.js";
import prisma from "../../../prisma.js";
import { logger } from "../common.js";
import { groupAutocomplete } from "../group-autocomplete.js";
import { GroupService } from "../group-service.js";

enum Errors {
  GROUP_NOT_FOUND = "GROUP_NOT_FOUND",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

@Command({
  event: DiscordEvent.SLASH_COMMAND,
  root: "group-mod",
  subCommand: "delete",
  description: "Delete a group",
  options: [
    {
      name: "group",
      type: ApplicationCommandOptionType.Integer,
      autocomplete: groupAutocomplete,
      description: "The group to be deleted",
      required: true,
    },
  ],
  errors: {
    [Errors.GROUP_NOT_FOUND]: "That group does not exist!",
    [Errors.UNKNOWN_ERROR]: "Failed to delete group!",
  },
})
class DeleteGroup implements CommandHandler<DiscordEvent.SLASH_COMMAND> {
  async handle(interaction: ChatInputCommandInteraction): Promise<void> {
    const groupId = interaction.options.getInteger("group")!;

    const groupService = new GroupService();
    const group = await groupService.getGroupById(groupId);

    if (!group) {
      throw new Error(Errors.GROUP_NOT_FOUND);
    }

    try {
      await prisma.userGroup.delete({ where: { id: group.id } });
    } catch (error) {
      logger.error("Failed to delete group, ", error);
      throw new Error(Errors.UNKNOWN_ERROR);
    }

    await interaction.reply(`Successfully deleted group "${group.name}"!`);
  }
}
