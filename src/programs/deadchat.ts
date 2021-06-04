import { Message } from "discord.js";
import Tools from "../common/tools";
import prisma from "../prisma";

const deadchat = async (message: Message) => {
  const thirtyMinutes = 30 * 60 * 1000;
  const isDead =
    Date.now() -
      (await message.channel.messages.fetch({ limit: 2 })).array()[1]
        .createdTimestamp >
    thirtyMinutes;

  if (!isDead) {
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
};

export default deadchat;
