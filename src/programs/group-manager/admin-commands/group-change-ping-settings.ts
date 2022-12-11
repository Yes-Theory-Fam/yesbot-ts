import { GroupPingSetting } from "@prisma/client";
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

const pingSettingToLabel: Record<GroupPingSetting, string> = {
  [GroupPingSetting.OFF]: "Disabled",
  [GroupPingSetting.BOT]: "YesBot only",
  [GroupPingSetting.MODERATOR]: "Support only",
  [GroupPingSetting.MEMBER]: "All members",
};

enum Errors {
  GROUP_NOT_FOUND = "GROUP_NOT_FOUND",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

@Command({
  event: DiscordEvent.SLASH_COMMAND,
  root: "group-mod",
  subCommand: "change-group-ping-settings",
  description: "Change a group's ping setting",
  options: [
    {
      name: "group",
      type: ApplicationCommandOptionType.Integer,
      autocomplete: groupAutocomplete,
      description: "Group the ping setting shall be changed of",
      required: true,
    },
    {
      name: "ping-setting",
      type: ApplicationCommandOptionType.String,
      description: "The new ping setting for the group",
      choices: Object.values(GroupPingSetting).map((s) => ({
        name: pingSettingToLabel[s],
        value: s,
      })),
      required: true,
    },
  ],
  errors: {
    [Errors.GROUP_NOT_FOUND]: "That group doesn't exist!",
    [Errors.UNKNOWN_ERROR]: "Failed to update ping setting!",
  },
})
class ChangeGroupPingSettings
  implements CommandHandler<DiscordEvent.SLASH_COMMAND>
{
  async handle(interaction: ChatInputCommandInteraction): Promise<void> {
    const groupId = interaction.options.getInteger("group")!;
    const pingSetting = interaction.options.getString(
      "ping-setting"
    )! as GroupPingSetting;

    const groupService = new GroupService();
    const group = await groupService.getGroupById(groupId);

    if (!group) {
      throw new Error(Errors.GROUP_NOT_FOUND);
    }

    try {
      await prisma.userGroup.update({
        where: { id: group.id },
        data: { groupPingSetting: pingSetting },
      });
    } catch (error) {
      logger.error("Failed to update database group ping settings, ", error);
      throw new Error(Errors.UNKNOWN_ERROR);
    }

    await interaction.reply(
      `Updated group ping setting of "${group.name}" to ${pingSettingToLabel[pingSetting]}`
    );
  }
}
