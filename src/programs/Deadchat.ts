import { Message, TextChannel } from "discord.js";
import { DeadchatQuestion } from "../entities";
import Tools from "../common/tools";

export default async function Deadchat(pMessage: Message) {
  const isDead =
    Date.now() -
      (await pMessage.channel.messages.fetch({ limit: 2 })).array()[1]
        .createdTimestamp >
    1800000; //|| pMessage.guild.name != "Yes Theory Fam";

  if (!isDead) {
    Tools.handleUserError(
      pMessage,
      "Chat is not dead! You can use this command if there have been no messages in the last 30 minutes."
    );
    return;
  }

  const question: DeadchatQuestion = await DeadchatQuestion.createQueryBuilder()
    .select()
    .andWhere("random() < 0.5 OR id = 1") // To get a random-ish question (strongly biased towards the top few questions but good enough I guess)
    .orderBy("last_used", "ASC")
    .limit(1)
    .getOne();

  if (question === undefined) {
    pMessage.channel.send(
      ":robot: Yikes! I could not find a question to use to revive chat. Is this the end?"
    );
    return;
  }
  pMessage.channel.send(question.question);
  question.lastUsed = new Date();
  question.save();
}
