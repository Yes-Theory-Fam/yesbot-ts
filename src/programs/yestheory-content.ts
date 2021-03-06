import Discord, { Message, TextChannel } from "discord.js";
import { ChatNames } from "../collections/chat-names";

//keep in mind this is very temporarily basic code, until we have the new events up and ready
const YesTheoryUploadedPing = async (message: Message) => {
  if (!message.webhookID) {
    return;
  }

  const channelDiscussion = message.guild.channels.cache.find(
    (channel) => channel.name === ChatNames.YESTHEORY_DISCUSSION.toString()
  ) as TextChannel;
  const embed = new Discord.MessageEmbed()
    .setColor("BLUE")
    .setTitle("YesTheory Uploaded!")
    .setDescription(
      `Yes Theory posted a new video! Go check it out in ${message.channel.toString()} and talk about it here`
    );
  await channelDiscussion.send("@group YesTheoryUploads");
  await channelDiscussion.send(embed);
};

export default YesTheoryUploadedPing;
