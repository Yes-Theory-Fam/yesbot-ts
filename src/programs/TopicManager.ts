import { Message, TextChannel, MessageAttachment } from "discord.js";
import axios from "axios";
import { TopicRepo } from "../entities/Topic";
import { Logger } from "../common/Logger";
import { isAuthorModerator } from "../common/moderator";
import { createTextSpanFromBounds } from "typescript";

const QUESTION_LINK: string =
  "https://spreadsheets.google.com/feeds/cells/1xUIqCaSrjyQzJeJfnXR0Hix6mDkaFhVauFmJb8Pzkj0/1/public/full?alt=json";
const MAKEUP_CHALLENGE_PICTURE_URL =
  "https://cdn.discordapp.com/attachments/698545400075780147/712491981158481940/image0.png";
const INKTOBER_IMAGE_URL =
  "https://media.discordapp.net/attachments/689589403189772291/761243856946987078/2020promptlist.png";

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
      const image = new MessageAttachment(MAKEUP_CHALLENGE_PICTURE_URL);
      message.channel.send(image);
      break;

    case "visual-design":
      message.channel.send(new MessageAttachment(INKTOBER_IMAGE_URL));
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
    Logger(
      "TopicManager",
      "setTopic",
      `There was an error inserting a topic into the Topicrepo: ${e.message}.`
    );
  }
};
