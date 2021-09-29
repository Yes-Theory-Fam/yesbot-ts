import { Message } from "discord.js";
import {
  Command,
  DiscordEvent,
  CommandHandler,
} from "../../event-distribution";
import prisma from "../../prisma";

@Command({
  event: DiscordEvent.MESSAGE,
  trigger: "!group",
  subTrigger: "create",
  allowedRoles: ["Support"],
  description:
    "This handler is to create a group and add description if included",
})
class CreateGroup implements CommandHandler<DiscordEvent.MESSAGE> {
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
        name: requestedGroupName,
      },
    });

    if (group) {
      await message.reply("That group already exists!");
      return;
    }
    await prisma.userGroup.create({
      data: {
        name: requestedGroupName,
        description,
      },
    });
    await message.react("👍");
  }
}
