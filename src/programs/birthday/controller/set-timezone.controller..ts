import { Message } from "discord.js";
import { ChatNames } from "../../../collections/chat-names";
import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../../event-distribution";
import prisma from "../../../prisma";
import { LetUserPickTimezoneUsecase } from "../usecase/let-user-pick-timezone.usecase";

@Command({
  event: DiscordEvent.MESSAGE,
  trigger: "!setTimezone",
  channelNames: [ChatNames.BOT_COMMANDS],
  description: "Set your timezone",
  errors: {
    "Timezone already known":
      "I already know your timezone. If you want to change it, please ping a Support.",
    "No birthday recorded":
      "I don't know your birthday. Please set it using `!birthday`",
  },
})
class SetTimezoneController extends CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message): Promise<void> {
    const existing = await prisma.birthday.findUnique({
      where: {
        userId: message.author.id,
      },
    });

    if (!existing) throw new Error("No birthday recorded");
    if (existing.timezone) throw new Error("Timezone already known");

    const timezone = await new LetUserPickTimezoneUsecase().getUserTimezone(
      message
    );

    await prisma.birthday.update({
      where: { userId: message.author.id },
      data: { timezone },
    });

    await message.reply("Timezone set!");
  }
}
