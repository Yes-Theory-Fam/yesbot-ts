import { Message, TextChannel, MessageAttachment } from "discord.js";
import axios from "axios";
import { isAuthorModerator } from "../common/moderator";
import { createYesBotLogger } from "../log";
import prisma from "../prisma";

const logger = createYesBotLogger("programs", "TopicManager");

const QUESTION_LINK: string =
  "https://spreadsheets.google.com/feeds/cells/1xUIqCaSrjyQzJeJfnXR0Hix6mDkaFhVauFmJb8Pzkj0/1/public/full?alt=json";
const MAKEUP_CHALLENGE_PICTURE_URL =
  "https://media.discordapp.net/attachments/747182765468024862/781575356083208242/2b41f33966eb91a117e8897d1bab2daf.jpg";
const MOVIE_CHALLENGE_PICTURE_URL =
  "https://cdn.discordapp.com/attachments/747182765468024862/781570321253793862/6eb01dc2c8218f6c8ab6181fd07abba0.png";
const DRAWING_CHALLENGE_PICTURE_URL =
  "https://cdn.discordapp.com/attachments/747182765468024862/781574814594760714/30-day-drawing-challenge.png";

export const TopicManager = async (message: Message) => {
  const channel: TextChannel = <TextChannel>message.channel;

  switch (channel.name) {
    case "philosophy":
      const response = await axios.get(QUESTION_LINK);
      let questions: string[] = [];
      let date = new Date().getDate();

      response.data.feed.entry.forEach((element: any) => {
        questions.push(element.content.$t);
      });

      date--;
      const question = questions[date];
      await message.channel.send(question);
      break;

    case "beauty-and-fashion":
      await message.channel.send(
        new MessageAttachment(MAKEUP_CHALLENGE_PICTURE_URL)
      );
      break;

    case "visual-design":
      await message.channel.send(
        new MessageAttachment(DRAWING_CHALLENGE_PICTURE_URL)
      );
      break;

    case "filmmaking":
      await message.channel.send(
        new MessageAttachment(MOVIE_CHALLENGE_PICTURE_URL)
      );
      break;

    case "trends":
      const currentTrend = await prisma.topic.findFirst({
        where: {
          channel: "trends",
        },
        orderBy: {
          id: "desc",
        },
      });

      if (currentTrend) {
        await message.reply(`Current Trend is ${currentTrend.topic}`);
      } else {
        await message.reply("There are no current trends, create one! :eyes: ");
      }
      break;

    default:
      break;
  }
};

export const setTopic = async (message: Message) => {
  const channel: TextChannel = <TextChannel>message.channel;

  if (!isAuthorModerator(message)) {
    await message.react("👎");
    return;
  }
  const cleanMessage = message.cleanContent.split(/\s+/);
  const attachment =
    message.attachments.size > 0 ? message.attachments.array()[0].url : "";
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
};
