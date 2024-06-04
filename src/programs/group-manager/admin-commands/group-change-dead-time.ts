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
  subCommand: "change-dead-time",
  description:
    "Change a group's dead-time (the time a chat must be dead to allow the group to be pinged)",
  options: [
    {
      name: "group",
      type: ApplicationCommandOptionType.Integer,
      autocomplete: groupAutocomplete,
      description: "The group the dead-time shall be changed of",
      required: true,
    },
    {
      name: "dead-time",
      type: ApplicationCommandOptionType.Integer,
      description: "The new dead-time for the group in seconds",
      required: true,
    },
  ],
  errors: {
    [Errors.GROUP_NOT_FOUND]: "That group doesn't exist!",
    [Errors.UNKNOWN_ERROR]: "Failed to update dead-time!",
  },
})
class ChangeDeadTime implements CommandHandler<DiscordEvent.SLASH_COMMAND> {
  async handle(interaction: ChatInputCommandInteraction): Promise<void> {
    const groupId = interaction.options.getInteger("group")!;
    const deadTime = interaction.options.getInteger("dead-time")!;

    const groupService = new GroupService();
    const group = await groupService.getGroupById(groupId);

    if (!group) {
      throw new Error(Errors.GROUP_NOT_FOUND);
    }

    try {
      await prisma.userGroup.update({
        where: { id: group.id },
        data: { deadtime: deadTime },
      });
    } catch (error) {
      logger.error("Failed to update database group deadTime, ", error);
      throw new Error(Errors.UNKNOWN_ERROR);
    }

    await interaction.reply(
      `Successfully set the new dead-time of group "${group.name}" to ${deadTime} seconds!`
    );
  }
}
