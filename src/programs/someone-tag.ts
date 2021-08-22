import { GuildMember, Message, TextChannel, User } from "discord.js";
import Tools from "../common/tools";
import { addHours, isAfter } from "date-fns";
import prisma from "../prisma";
import { getFirstColumnFromGoogleSheet } from "../common/custom-methods";

const QUESTION_SHEET_ID: string =
  "1eve4McRxECmH4dLWLJvHLr9fErBWcCGiH94ihBNzK_s";

const someoneTag = async (message: Message) => {
  const allow = await isAllowed(message.author);

  if (!allow) {
    await Tools.handleUserError(
      message,
      "You have already used this command today!"
    );
    return;
  }

  const seekDiscomfortRole = Tools.getRoleByName(
    "Seek Discomfort",
    message.guild
  );
  const hasSeekDiscomfort = message.member.roles.cache.has(
    seekDiscomfortRole.id
  );

  if (!hasSeekDiscomfort) {
    await Tools.handleUserError(
      message,
      "You need the Seek Discomfort role for that! You can get one by writing a detailed bio of yourself in <#616616321089798145>."
    );
    return;
  }

  const words = Tools.stringToWords(message.cleanContent);
  const arg = words[1];
  if (arg && arg !== "online")
    await message.channel.send(
      `Unknown argument "${arg}". Did you mean "online"?`,
      {
        disableMentions: "all",
      }
    );
  else {
    const { member } = message;
    const target = await getTarget(arg, message);
    const question = await getQuestion();
    if (!target)
      await message.reply(
        "There were no available users to ping! This is embarrassing. How could this have happened? There's so many people on here that statistically this message should never even show up. Oh well. Congratulations, I guess."
      );
    else {
      await updateLastMessage(message);
      await sendMessage(
        member,
        target,
        question,
        message.channel as TextChannel
      );
    }
  }

  await message.delete();
};

const sendMessage = async (
  author: GuildMember,
  target: User,
  question: string,
  channel: TextChannel
) => {
  const webhook = await channel.createWebhook(author.displayName, {
    avatar: author.user.avatarURL({ format: "png" }),
  });
  await webhook.send(`<@${target.id}> ${question}`);
  await webhook.delete();
};

async function updateLastMessage(message: Message) {
  const data = {
    id: message.author.id,
    time: new Date(),
  };

  try {
    await prisma.someoneUser.upsert({
      where: { id: data.id },
      update: { time: data.time },
      create: data,
    });
  } catch (e) {
    console.error(`Failed to save @someone for user '${data.id}'`);
    return false;
  }

  return true;
}

async function isAllowed(user: User) {
  const someone = await prisma.someoneUser.findUnique({
    where: { id: user.id },
  });

  if (!someone) {
    return true;
  }

  return isAfter(new Date(), addHours(someone.time, 24));
}

async function getTarget(arg: string, message: Message): Promise<User> {
  if (!message) return;

  const sdRole = Tools.getRoleByName("Seek Discomfort", message.guild);
  if (!sdRole) {
    await message.channel.send(
      "There is no Seek Discomfort role in this server!"
    );
    return;
  }

  const targetCollection =
    arg && arg === "online"
      ? sdRole.members.filter(
          (member) => member.user.presence.status === "online"
        )
      : sdRole.members;

  if (
    targetCollection.size === 0 ||
    (targetCollection.size === 1 &&
      targetCollection.first().user.id === message.author.id)
  )
    return;

  let randomUser;
  do {
    randomUser = targetCollection.random().user;
  } while (randomUser.id === message.author.id);

  return randomUser;
}

async function getQuestion() {
  const questions = await getFirstColumnFromGoogleSheet(QUESTION_SHEET_ID);
  const randomIndex = Math.floor(Math.random() * questions.length);
  return questions[randomIndex];
}

export default someoneTag;
