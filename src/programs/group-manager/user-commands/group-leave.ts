import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
} from "discord.js";
import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../../event-distribution/index.js";
import { groupAutocomplete } from "../group-autocomplete.js";
import { GroupService, GroupServiceErrors } from "../group-service.js";

enum Errors {
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

@Command({
  event: DiscordEvent.SLASH_COMMAND,
  root: "group",
  subCommand: "leave",
  description: "Leave a pingable group!",
  options: [
    {
      name: "group",
      type: ApplicationCommandOptionType.Integer,
      description: "The group you want to leave",
      autocomplete: groupAutocomplete,
      required: true,
    },
  ],
  errors: {
    [Errors.UNKNOWN_ERROR]: "Failed to remove you from the selected group",
  },
})
class LeaveGroup implements CommandHandler<DiscordEvent.SLASH_COMMAND> {
  async handle(interaction: ChatInputCommandInteraction): Promise<void> {
    const groupId = interaction.options.getInteger("group")!;

    const groupService = new GroupService();

    try {
      await groupService.leaveGroup(groupId, interaction.user.id);
    } catch (e) {
      if (
        !(e instanceof Error) ||
        e.message !== GroupServiceErrors.RELATION_NOT_FOUND
      ) {
        throw new Error(Errors.UNKNOWN_ERROR);
      }
    }

    await interaction.reply({
      ephemeral: true,
      content: "Removed you from the group!",
    });
  }
}
