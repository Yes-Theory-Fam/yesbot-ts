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
  GROUP_NOT_FOUND = "GROUP_NOT_FOUND",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

@Command({
  event: DiscordEvent.SLASH_COMMAND,
  root: "group",
  subCommand: "join",
  description: "Join a pingable group!",
  options: [
    {
      name: "group",
      type: ApplicationCommandOptionType.Integer,
      autocomplete: groupAutocomplete,
      description: "The group you want to join",
      required: true,
    },
  ],
  errors: {
    [Errors.GROUP_NOT_FOUND]: "I couldn't find the group you selected",
    [Errors.UNKNOWN_ERROR]: "Failed to add you to the group",
  },
})
class JoinGroup implements CommandHandler<DiscordEvent.SLASH_COMMAND> {
  async handle(interaction: ChatInputCommandInteraction): Promise<void> {
    const groupId = interaction.options.getInteger("group")!;

    const groupService = new GroupService();
    const group = await groupService.getGroupWithMembers(groupId);

    const user = interaction.user;

    if (!group) {
      throw new Error(Errors.GROUP_NOT_FOUND);
    }

    try {
      await groupService.joinGroup(groupId, user.id);
    } catch (e) {
      if (
        !(e instanceof Error) ||
        e.message !== GroupServiceErrors.RELATION_ALREADY_EXISTS
      ) {
        throw new Error(Errors.UNKNOWN_ERROR);
      }
    }

    await interaction.reply({
      ephemeral: true,
      content: `Added you to group ${group.name}!`,
    });
  }
}
