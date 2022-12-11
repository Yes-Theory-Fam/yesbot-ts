import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  Message,
} from "discord.js";
import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../../event-distribution";
import prisma from "../../../prisma";
import { getRequestedGroup, logger } from "../common";

enum Errors {
  GROUP_ALREADY_EXISTS = "GROUP_ALREADY_EXISTS",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

@Command({
  event: DiscordEvent.SLASH_COMMAND,
  root: "group-mod",
  subCommand: "create",
  description: "Create a new group!",
  options: [
    {
      type: ApplicationCommandOptionType.String,
      name: "name",
      description: "The name of the newly created group",
      required: true,
    },
    {
      type: ApplicationCommandOptionType.String,
      name: "description",
      description: "The description for the newly created group",
      required: false,
    },
  ],
  errors: {
    [Errors.GROUP_ALREADY_EXISTS]: "That group already exists!",
    [Errors.UNKNOWN_ERROR]: "Failed to create group!",
  },
})
class CreateGroup implements CommandHandler<DiscordEvent.SLASH_COMMAND> {
  async handle(interaction: ChatInputCommandInteraction): Promise<void> {
    const name = interaction.options.getString("name")!;
    const description = interaction.options.getString("description");

    const group = await getRequestedGroup(name);

    if (group) {
      throw new Error(Errors.GROUP_ALREADY_EXISTS);
    }

    try {
      await prisma.userGroup.create({
        data: {
          name,
          description: description ?? "",
        },
      });
    } catch (error) {
      logger.error("Failed to create group, ", error);
      throw new Error(Errors.UNKNOWN_ERROR);
    }

    await interaction.reply(`Successfully created group "${name}"!`);
  }
}
