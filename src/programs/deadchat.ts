import { Message } from "discord.js";
import Tools from "../common/tools";
import prisma from "../prisma";

export default async function Deadchat(pMessage: Message) {
  const isDead =
    Date.now() -
      (await pMessage.channel.messages.fetch({ limit: 2 })).array()[1]
        .createdTimestamp >
    1800000; //|| pMessage.guild.name != "Yes Theory Fam";

  if (!isDead) {
    await Tools.handleUserError(
      pMessage,
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
    await pMessage.channel.send(
      ":robot: Yikes! I could not find a question to use to revive chat. Is this the end?"
    );
    return;
  }
  await pMessage.channel.send(question.question);
  question.lastUsed = new Date();
  await prisma.deadchatQuestion.update({
    where: { id: question.id },
    data: question,
  });
}
