import { Message } from "discord.js";
import Tools from "../../../common/tools";
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
  subTrigger: "changeDeadtime",
  allowedRoles: ["Support"],
  description: "This handler is to change the group DeadTime",
})
class ChangeDeadTime implements CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message): Promise<void> {
    const words = message.content.split(" ").slice(2);
    const requestedGroupName = words[0];
    const newDeadtime = words[1];

    const deadtimeNumber = Number(newDeadtime);
    if (isNaN(deadtimeNumber) || deadtimeNumber < 0) {
      await Tools.handleUserError(
        message,
        "Please write a postive number for the new deadtime! It will be interpreted as minutes for how long the chat needs to be dead for the group to be pinged"
      );
      return;
    }

    const group = await getRequestedGroup(requestedGroupName);

    if (!group) {
      await message.reply("That group doesn't exist!");
      return;
    }

    await prisma.userGroup
      .update({
        where: { id: group.id },
        data: { deadtime: deadtimeNumber },
      })
      .catch(async (error) => {
        logger.error("Failed to update database group deadTime, ", error);
        await message.react("👎");
        return;
      });

    await message.react("👍");
  }
}
