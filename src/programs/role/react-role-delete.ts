import { Message } from "discord.js";
import Tools from "../../common/tools";
import prisma from "../../prisma";
import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../event-distribution";
import { createYesBotLogger } from "../../log";

const logger = createYesBotLogger("programs", "role-delete");

@Command({
  event: DiscordEvent.MESSAGE,
  trigger: "!role",
  subTrigger: "delete",
  allowedRoles: ["Support"],
  description: "This",
})
class DeleteReactRoleObjects implements CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message): Promise<void> {
    console.log(message.content.split(" "));
    const index = Number(message.content.split(" ")[2]);

    if (isNaN(index) || !index) {
      await Tools.handleUserError(message, "You must input an index number");
      return;
    }

    const objectToRemove = await prisma.reactionRole.findUnique({
      where: { id: index },
    });

    if (objectToRemove) {
      try {
        await prisma.reactionRole.delete({ where: { id: index } });
      } catch (err) {
        await message.channel.send(`Failed to delete reaction role.`);
        logger.error("Failed to delete reaction role: ", err);
        return;
      }
      let [messageWithReaction] = await Tools.getMessageById(
        objectToRemove.messageId,
        message.guild,
        objectToRemove.channelId
      );
      try {
        await messageWithReaction.reactions.removeAll();
      } catch (err) {
        // We don't really care about the error, since the message/channel might have been removed.
        // We log it for good measure.
        logger.error(
          "Error while removing all reactions from a reactionRole message",
          err
        );
      }
      await message.channel.send("Successfully removed reaction role.");
    } else {
      await message.reply("I cannot find a role with that ID.");
    }
  }
}
