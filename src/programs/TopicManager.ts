import { Message, TextChannel, MessageAttachment } from "discord.js";
import axios from "axios";
import { TopicRepo } from "../entities/Topic";
import { isAuthorModerator } from "../common/moderator";
import { createYesBotLogger } from "../log";

const logger = createYesBotLogger("programs", "TopicManager");

const QUESTION_LINK: string =
  "https://spreadsheets.google.com/feeds/cells/1xUIqCaSrjyQzJeJfnXR0Hix6mDkaFhVauFmJb8Pzkj0/1/public/full?alt=json";
const MAKEUP_CHALLENGE_PICTURE_URL =
  "https://media.discordapp.net/attachments/747182765468024862/781575356083208242/2b41f33966eb91a117e8897d1bab2daf.jpg";
const MOVIE_CHALLENGE_PICTURE_URL =
  "https://cdn.discordapp.com/attachments/747182765468024862/781570321253793862/6eb01dc2c8218f6c8ab6181fd07abba0.png";
const DRAWING_CHALLENGE_PICTURE_URL =
  "https://cdn.discordapp.com/attachments/747182765468024862/781574814594760714/30-day-drawing-challenge.png";

export default async function TopicManager(message: Message) {
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
      message.channel.send(question);
      break;

    case "beauty-and-fashion":
      message.channel.send(new MessageAttachment(MAKEUP_CHALLENGE_PICTURE_URL));
      break;

    case "visual-design":
      message.channel.send(
        new MessageAttachment(DRAWING_CHALLENGE_PICTURE_URL)
      );
      break;

    case "filmmaking":
      message.channel.send(new MessageAttachment(MOVIE_CHALLENGE_PICTURE_URL));
      break;

    case "trends":
      const topicRepo = await TopicRepo();
      const currentTrend = await topicRepo
        .createQueryBuilder("topic")
        .select()
        .where("topic.channel = :channel", { channel: "trends" })
        .orderBy("topic.id", "DESC")
        .limit(1)
        .getOne();
      if (currentTrend) {
        message.reply(`Current Trend is ${currentTrend.topic}`);
      } else {
        message.reply("There are no current trends, create one! :eyes: ");
      }
      break;

    default:
      break;
  }
}

export const setTopic = async (message: Message) => {
  const channel: TextChannel = <TextChannel>message.channel;

  const topicRepo = await TopicRepo();
  if (!isAuthorModerator(message)) {
    message.react("👎");
    return;
  }
  const cleanMessage = message.cleanContent.split(/\s+/);
  const attachment =
    message.attachments.size > 0 ? message.attachments.array()[0].url : "";
  cleanMessage.shift();
  cleanMessage.push(attachment);
  const joinedMsg = cleanMessage.join(" ");
  const newTopic = topicRepo.create({
    topic: joinedMsg,
    channel: channel.name,
    created: new Date(),
  });

  try {
    await topicRepo.save(newTopic).then(() => {
      message.react("👍");
    });
  } catch (e) {
    logger.error("(setTopic) Error adding topic", e);
  }
};
