import Discord, { Message, TextChannel } from "discord.js";
import { ChatNames } from "../collections/chat-names";
import { Command, CommandHandler, DiscordEvent } from "../event-distribution";

@Command({
  event: DiscordEvent.MESSAGE,
  channelNames: ["yestheoryposted"],
  description:
    "This handler is for when yestheory uploads user in the specified group are pinged",
})
class YesTheoryUploadedPing implements CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message) {
    if (!message.webhookId) return;

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
    await channelDiscussion.send({ embeds: [embed] });
  }
}
