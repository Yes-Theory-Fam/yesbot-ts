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
  subCommand: "change-cooldown",
  description: "Change a group's cooldown",
  options: [
    {
      name: "group",
      type: ApplicationCommandOptionType.Integer,
      autocomplete: groupAutocomplete,
      description: "The group to edit",
      required: true,
    },
    {
      name: "cooldown",
      type: ApplicationCommandOptionType.Integer,
      description: "The new cooldown in seconds",
      required: true,
    },
  ],
  errors: {
    [Errors.GROUP_NOT_FOUND]: "Could not find the specified group",
    [Errors.UNKNOWN_ERROR]: "Failed to update cooldown!",
  },
})
class ChangeCooldown implements CommandHandler<DiscordEvent.SLASH_COMMAND> {
  async handle(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply();

    const groupId = interaction.options.getInteger("group")!;
    const cooldown = interaction.options.getInteger("cooldown")!;

    const groupService = new GroupService();
    const group = await groupService.getGroupById(groupId);

    if (!group) throw new Error(Errors.GROUP_NOT_FOUND);

    try {
      await prisma.userGroup.update({
        where: { id: group.id },
        data: { cooldown: cooldown },
      });
    } catch (error) {
      logger.error("Failed to update database cooldown, ", error);
      throw new Error(Errors.UNKNOWN_ERROR);
    }

    await interaction.editReply(
      `Updated cooldown of group "${group.name}" to ${cooldown} seconds!`
    );
  }
}
