import { GroupPingSetting } from "@yes-theory-fam/database/client";
import { Message } from "discord.js";
import Tools from "../../common/tools";
import {
  Command,
  DiscordEvent,
  CommandHandler,
} from "../../event-distribution";
import prisma from "../../prisma";
import { logger } from "./common";

@Command({
  event: DiscordEvent.MESSAGE,
  trigger: "!group",
  subTrigger: "changeGroupPingSettings",
  allowedRoles: ["Support"],
  description: "This handler is to change the group ping setting",
})
class ChangeGroupPingSettings implements CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message): Promise<void> {
    const words = message.content.split(" ").slice(2);
    const requestedGroupName = words[0];
    const option = words[1];

    const setting = option.toUpperCase();

    if (
      setting !== GroupPingSetting.MODERATOR &&
      setting !== GroupPingSetting.MEMBER &&
      setting !== GroupPingSetting.BOT &&
      setting !== GroupPingSetting.OFF
    ) {
      await Tools.handleUserError(
        message,
        "Please write a valid setting for the group ping! The options are `moderator`, `member`, `bot` or `off`."
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

    if (!group) {
      await message.reply("That group doesn't exist!");
      return;
    }

    try {
      await prisma.userGroup.update({
        where: { id: group.id },
        data: { groupPingSetting: GroupPingSetting[setting] },
      });
    } catch (error) {
      logger.error("Failed to update database group ping settings," + error);
      await message.react("👎");
      return;
    }

    await message.react("👍");
  }
}
