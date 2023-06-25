import {
  APIInteractionGuildMember,
  TextChannel,
  User,
  ChatInputCommandInteraction,
  ApplicationCommandOptionType,
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
  description: "Ping a random member.",
  options: [
    {
      type: ApplicationCommandOptionType.Boolean,
      name: "online",
      description: "If true, ensures the pinged member is online.",
      required: false,
    },
  ],
})
class SomeoneTag implements CommandHandler<DiscordEvent.SLASH_COMMAND> {
  async handle(interaction: ChatInputCommandInteraction): Promise<void> {
    const allow = await isAllowed(interaction.user);

    if (!allow) {
      await interaction.reply({
        content: "You have already used this command today!",
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    const { member } = interaction;
    if (!member) return;

    const target = await getTarget(
      interaction.options.getBoolean("online") ?? false,
      interaction
    );
    const question = await getQuestion();
    if (!target) {
      await interaction.editReply({
        content:
          "There were no available users to ping! This is embarrassing. How could this have happened? There's so many people on here that statistically this message should never even show up. Oh well. Congratulations, I guess.",
      });
    } else {
      await sendMessage(
        member.user as User,
        target,
        question,
        interaction.channel as TextChannel
      );

      await prisma.someoneUser.upsert({
        where: { id: member.user.id },
        update: { time: new Date() },
        create: { id: member.user.id, time: new Date() },
      });
      await interaction.editReply({ content: "Done!" });
    }
  }
}

const sendMessage = async (
  author: User,
  target: User,
  question: string,
  channel: TextChannel
) => {
  const authorMember = await channel.guild.members.fetch(author);

  const webhook = await channel.createWebhook({
    name: authorMember.displayName,
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
