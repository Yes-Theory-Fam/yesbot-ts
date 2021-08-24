import Tools from "../common/tools";
import prisma from "../prisma";

import { Command, CommandHandler, DiscordEvent } from "../event-distribution";
import { Message } from "discord.js";

const thirtyMinutes = 30 * 60 * 1000;

const isDead = async (message: Message): Promise<boolean> => {
  const lastMessages = (
    await message.channel.messages.fetch({ limit: 2 })
  ).values();
  const lastMessage = [...lastMessages][1];

  return Date.now() - lastMessage.createdTimestamp > thirtyMinutes;
};

@Command({
  event: DiscordEvent.MESSAGE,
  trigger: "!deadchat",
  channelNames: ["chat", "chat-too", "4th-chat", "chat-v"],
  description: "This handler is for the deadchat command",
})
class DeadchatCommand implements CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message): Promise<void> {
    if (!(await isDead(message))) {
      await Tools.handleUserError(
        message,
        "Chat is not dead! You can use this command if there have been no messages in the last 30 minutes."
      );
      return;
    }

    const question = await prisma.deadchatQuestion.findFirst({
      orderBy: {
        lastUsed: "asc",
      },
    });

    if (!question) {
      await message.channel.send(
        ":robot: Yikes! I could not find a question to use to revive chat. Is this the end?"
      );
      return;
    }

    await message.channel.send(question.question);
    question.lastUsed = new Date();
    await prisma.deadchatQuestion.update({
      where: { id: question.id },
      data: question,
    });
  }
}
