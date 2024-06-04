import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
} from "discord.js";
import Tools from "../../common/tools.js";
import prisma from "../../prisma.js";
import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../event-distribution/index.js";
import { createYesBotLogger } from "../../log.js";
import { reactRoleAutocomplete } from "./react-role-autocomplete.js";

const logger = createYesBotLogger("programs", "role-delete");

enum Errors {
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
  ENTRY_NOT_FOUND = "ENTRY_NOT_FOUND",
}

@Command({
  event: DiscordEvent.SLASH_COMMAND,
  root: "role",
  subCommand: "delete",
  description: "Delete a reaction-role",
  options: [
    {
      name: "reaction-role",
      type: ApplicationCommandOptionType.Integer,
      required: true,
      autocomplete: reactRoleAutocomplete,
      description: "The reaction-role to delete",
    },
  ],
  errors: {
    [Errors.UNKNOWN_ERROR]: "Failed to delete reaction-role",
    [Errors.ENTRY_NOT_FOUND]: "Could not find that reaction-role",
  },
})
class DeleteReactRoleObjects
  implements CommandHandler<DiscordEvent.SLASH_COMMAND>
{
  async handle(interaction: ChatInputCommandInteraction): Promise<void> {
    const reactionRoleId = interaction.options.getInteger("reaction-role")!;

    const objectToRemove = await prisma.reactionRole.findUnique({
      where: { id: reactionRoleId },
    });

    if (!objectToRemove) {
      throw new Error(Errors.ENTRY_NOT_FOUND);
    }

    try {
      await prisma.reactionRole.delete({ where: { id: reactionRoleId } });
    } catch (err) {
      logger.error("Failed to delete reaction role: ", err);
      throw new Error(Errors.UNKNOWN_ERROR);
    }

    const [messageWithReaction] = (await Tools.getMessageById(
      objectToRemove.messageId,
      interaction.guild!,
      objectToRemove.channelId
    )) ?? [null];

    try {
      await messageWithReaction?.reactions.cache
        .find((x) => x.emoji.name === objectToRemove.reaction)
        ?.remove();
    } catch (err) {
      // We don't really care about the error, since the message/channel might have been removed.
      // We log it for good measure.
      logger.error(
        "Error while removing all reactions from a reactionRole message",
        err
      );
    }

    await interaction.reply("Successfully removed reaction role.");
  }
}
