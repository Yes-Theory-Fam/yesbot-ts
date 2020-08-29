import Discord, { TextChannel } from "discord.js";
import axios from "axios";

const QUESTION_LINK: string =
  "https://spreadsheets.google.com/feeds/cells/1xUIqCaSrjyQzJeJfnXR0Hix6mDkaFhVauFmJb8Pzkj0/1/public/full?alt=json";
const MAKEUP_CHALLENGE_PICTURE_URL =
  "https://cdn.discordapp.com/attachments/698545400075780147/712491981158481940/image0.png";

export default async function TopicManager(message: Discord.Message) {
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
      const image = new Discord.MessageAttachment(MAKEUP_CHALLENGE_PICTURE_URL);
      message.channel.send(image);

    default:
      break;
  }
}
