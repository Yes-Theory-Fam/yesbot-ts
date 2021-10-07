import { Message } from "discord.js";
import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../../event-distribution";
import prisma from "../../../prisma";
import { getRequestedGroup, logger } from "../common";

@Command({
  event: DiscordEvent.MESSAGE,
  trigger: "!group",
  subTrigger: "delete",
  allowedRoles: ["Support"],
  description: "This handler is to delete a group",
})
class DeleteGroup implements CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message): Promise<void> {
    const words = message.content.split(" ").slice(2);
    const requestedGroupName = words[0];

    if (!requestedGroupName) {
      await message.react("👎");
      return;
    }

    const group = await getRequestedGroup(requestedGroupName);

    if (!group) {
      await message.reply("That group does not exist!");
      return;
    }

    await prisma.userGroup
      .delete({ where: { id: group.id } })
      .catch(async (error) => {
        logger.error("Failed to delete group, ", error);
        await message.react("👎");
        return;
      });

    await message.react("👍");
  }
}
