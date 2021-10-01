import { Message } from "discord.js";
import { Command, CommandHandler, DiscordEvent } from "../../../event-distribution";
import prisma from "../../../prisma";
import { logger } from "../common";


@Command({
  event: DiscordEvent.MESSAGE,
  trigger: "!group",
  subTrigger: "update",
  allowedRoles: ["Support"],
  description: "This handler is to update a group description",
})
class UpdateGroup implements CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message): Promise<void> {
    const words = message.content.split(" ").slice(2);
    const [requestedGroupName, ...rest] = words;
    const description = rest.join(" ");

    if (!requestedGroupName) {
      await message.react("👎");
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

    if (!group) {
      await message.reply("That group doesn't exist!");
      return;
    }

    const previousDescription = group.description;

    try {
      await prisma.userGroup.update({
        where: { id: group.id },
        data: { description },
      });
    } catch (error) {
      logger.error("Failed to update group description," + error);
      await message.react("👎");
      return;
    }

    await message.reply(
      `Group description updated from \n> ${previousDescription} \nto \n> ${description}`
    );
  }
}
