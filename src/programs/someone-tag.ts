import {
  GuildMember,
  APIInteractionGuildMember,
  TextChannel,
  User,
  ChatInputCommandInteraction,
  ApplicationCommandOptionType,
  Guild,
} from "discord.js";
import Tools from "../common/tools";
import { addHours, isAfter } from "date-fns";
import prisma from "../prisma";
import { Command, CommandHandler, DiscordEvent } from "../event-distribution";

const QUESTION_SHEET_ID: string =
  "1eve4McRxECmH4dLWLJvHLr9fErBWcCGiH94ihBNzK_s";

@Command({
  event: DiscordEvent.SLASH_COMMAND,
  root: "someone",
  description: "Ping a random memeber.",
  options: [
    {
      type: ApplicationCommandOptionType.Boolean,
      name: "Online",
      description: "Should the person be Online.",
      required: true,
    },
  ],
})
class SomeoneTag implements CommandHandler<DiscordEvent.SLASH_COMMAND> {
  async handle(interaction: ChatInputCommandInteraction): Promise<void> {
    const allow = await isAllowed(interaction.user);

    if (!allow) {
      interaction.reply("You have already used this command today!");
      return;
    }

    const { member } = interaction;
    if (!member) return;

    const target = await getTarget(
      interaction.options.getBoolean("Online"),
      interaction
    );
    const question = await getQuestion();
    if (!target) {
      await interaction.reply(
        "There were no available users to ping! This is embarrassing. How could this have happened? There's so many people on here that statistically this message should never even show up. Oh well. Congratulations, I guess."
      );
    } else {
      await sendMessage(
        member.user as User,
        target,
        question,
        interaction.channel as TextChannel
      );
    }
  }
}

const sendMessage = async (
  author: User,
  target: User,
  question: string,
  channel: TextChannel
) => {
  const webhook = await channel.createWebhook({
    name: author.username,
    avatar: author.avatarURL({ extension: "png" }),
  });
  await webhook.send(`<@${target.id}> ${question}`);
  await webhook.delete();
};

async function isAllowed(user: User) {
  const someone = await prisma.someoneUser.findUnique({
    where: { id: user.id },
  });

  if (!someone) {
    return true;
  }

  return isAfter(new Date(), addHours(someone.time, 24));
}

async function getTarget(
  arg: boolean | null,
  message: ChatInputCommandInteraction
): Promise<User | undefined> {
  if (!message?.guild) return;

  const sdRole = Tools.getRoleByName("Seek Discomfort", message.guild);
  if (!sdRole) {
    await message.channel?.send(
      "There is no Seek Discomfort role in this server!"
    );
    return;
  }

  const targetCollection = arg
    ? sdRole.members.filter((member) => member.presence?.status === "online")
    : sdRole.members;

  if (
    targetCollection.size === 0 ||
    (targetCollection.size === 1 &&
      targetCollection.first()?.user.id === message.user.id)
  )
    return;

  let randomUser;
  do {
    randomUser = targetCollection.random()?.user;
  } while (randomUser?.id === message.user.id);

  return randomUser;
}

async function getQuestion() {
  const questions = await Tools.getFirstColumnFromGoogleSheet(
    QUESTION_SHEET_ID
  );
  const randomIndex = Math.floor(Math.random() * questions.length);
  return questions[randomIndex];
}
