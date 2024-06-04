import prisma from "../prisma.js";

import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../event-distribution/index.js";
import { ChatInputCommandInteraction, TextChannel } from "discord.js";

const thirtyMinutes = 30 * 60 * 1000;

const isDead = async (
  interaction: ChatInputCommandInteraction
): Promise<boolean> => {
  const channel = interaction.channel as TextChannel;
  const lastMessage = (await channel.messages.fetch({ limit: 1 })).first();

  if (!lastMessage) return true;
  return Date.now() - lastMessage.createdTimestamp > thirtyMinutes;
};

@Command({
  event: DiscordEvent.SLASH_COMMAND,
  root: "deadchat",
  description: "Revive the chat with a thought provoking question!",
})
class DeadchatCommand implements CommandHandler<DiscordEvent.SLASH_COMMAND> {
  async handle(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!(await isDead(interaction))) {
      await interaction.reply({
        content:
          "Chat is not dead You can use this command if there have been no messages in the last 30 minutes.",
        ephemeral: true,
      });
      return;
    }

    const question = await prisma.deadchatQuestion.findFirst({
      orderBy: {
        lastUsed: "asc",
      },
    });

    if (!question) {
      await interaction.reply(
        ":robot: Yikes! I could not find a question to use to revive chat. Is this the end?"
      );
      return;
    }

    await interaction.reply(question.question);
    question.lastUsed = new Date();
    await prisma.deadchatQuestion.update({
      where: { id: question.id },
      data: question,
    });
  }
}
