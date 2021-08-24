import { Message, MessageAttachment, TextChannel } from "discord.js";
import Tools from "../common/tools";
import { Command, CommandHandler, DiscordEvent } from "../event-distribution";
import { createYesBotLogger } from "../log";
import prisma from "../prisma";

const logger = createYesBotLogger("programs", "topics");

const QUESTION_SHEET_ID: string =
  "1xUIqCaSrjyQzJeJfnXR0Hix6mDkaFhVauFmJb8Pzkj0";
const MAKEUP_CHALLENGE_PICTURE_URL =
  "https://media.discordapp.net/attachments/747182765468024862/781575356083208242/2b41f33966eb91a117e8897d1bab2daf.jpg";
const MOVIE_CHALLENGE_PICTURE_URL =
  "https://cdn.discordapp.com/attachments/747182765468024862/781570321253793862/6eb01dc2c8218f6c8ab6181fd07abba0.png";
const DRAWING_CHALLENGE_PICTURE_URL =
  "https://cdn.discordapp.com/attachments/747182765468024862/781574814594760714/30-day-drawing-challenge.png";

@Command({
  event: DiscordEvent.MESSAGE,
  trigger: "!topic",
  channelNames: [
    "philosophy",
    "beauty-and-fashion",
    "visual-design",
    "filmmaking",
  ],
  description: "This handler shows the current topic of the channel.",
})
class Topics implements CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message): Promise<void> {
    const channel = message.channel as TextChannel;

    switch (channel.name) {
      case "philosophy":
        const questions = await Tools.getFirstColumnFromGoogleSheet(
          QUESTION_SHEET_ID
        );

        const date = new Date().getDate() - 1;
        const question = questions[date];
        await message.channel.send(question);
        break;

      case "beauty-and-fashion":
        await message.channel.send({
          embeds: [new MessageAttachment(MAKEUP_CHALLENGE_PICTURE_URL)],
        });
        break;

      case "visual-design":
        await message.channel.send({
          embeds: [new MessageAttachment(DRAWING_CHALLENGE_PICTURE_URL)],
        });
        break;

      case "filmmaking":
        await message.channel.send({
          embeds: [new MessageAttachment(MOVIE_CHALLENGE_PICTURE_URL)],
        });
        break;
    }
  }
}

@Command({
  event: DiscordEvent.MESSAGE,
  trigger: "!trend",
  channelNames: ["trends"],
  description: "This handler sends the ongoing trend on the server.",
})
class Trend implements CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message): Promise<void> {
    const currentTrend = await prisma.topic.findFirst({
      where: {
        channel: "trends",
      },
      orderBy: {
        id: "desc",
      },
    });

    if (!currentTrend) {
      await Tools.handleUserError(
        message,
        "There are no current trends, create one! :eyes:"
      );
      return;
    }

    await message.reply(`Current Trend is ${currentTrend.topic}`);
  }
}

@Command({
  event: DiscordEvent.MESSAGE,
  trigger: "!trendSet",
  allowedRoles: ["Support"],
  description: "This",
})
class SetTopic implements CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message): Promise<void> {
    const channel = message.channel as TextChannel;

    const cleanMessage = message.cleanContent.split(/\s+/);
    const attachment =
      message.attachments.size > 0
        ? [...message.attachments.values()][0].url
        : "";
    cleanMessage.shift();
    cleanMessage.push(attachment);
    const joinedMsg = cleanMessage.join(" ");
    const data = {
      topic: joinedMsg,
      channel: channel.name,
      created: new Date(),
    };

    try {
      await prisma.topic.create({ data }).then(() => {
        message.react("👍");
      });
    } catch (e) {
      logger.error("(setTopic) Error adding topic", e);
    }
  }
}
