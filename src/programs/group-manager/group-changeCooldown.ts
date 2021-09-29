import { Message } from "discord.js";
import Tools from "../../common/tools";
import {
  Command,
  DiscordEvent,
  CommandHandler,
} from "../../event-distribution";
import prisma from "../../prisma";

@Command({
  event: DiscordEvent.MESSAGE,
  trigger: "!group",
  subTrigger: "changeCooldown",
  allowedRoles: ["Support"],
  description: "This handler is to change the group cooldown",
})
class ChangeCooldown implements CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message): Promise<void> {
    const words = message.content.split(" ").slice(2);
    const requestedGroupName = words[0];
    const newCooldown = words[1];

    const cooldownNumber = Number(newCooldown);
    if (isNaN(cooldownNumber)) {
      await Tools.handleUserError(
        message,
        "Please write a number for the new cooldown! It will be interpreted as minutes before the group can be pinged again."
      );
      return;
    }

    const group = await prisma.userGroup.findFirst({
      where: {
        name: {
          equals: requestedGroupName,
          mode: "insensitive",
        },
      },
    });

    await prisma.userGroup.update({
      where: { id: group.id },
      data: { cooldown: cooldownNumber },
    });

    await message.react("👍");
  }
}
