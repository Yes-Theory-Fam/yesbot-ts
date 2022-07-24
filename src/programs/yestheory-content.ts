import Discord, { Colors, Message, TextChannel } from "discord.js";
import { ChatNames } from "../collections/chat-names";
import { Command, CommandHandler, DiscordEvent } from "../event-distribution";
import Tools from "../common/tools";

@Command({
  event: DiscordEvent.MESSAGE,
  channelNames: ["yestheoryposted"],
  description:
    "This handler is for when yestheory uploads user in the specified group are pinged",
})
class YesTheoryUploadedPing implements CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message) {
    if (!message.webhookId) return;

    const channelDiscussion = message.guild?.channels.cache.find(
      (channel) => channel.name === ChatNames.YESTHEORY_DISCUSSION.toString()
    ) as TextChannel;
    const embed = new Discord.EmbedBuilder()
      .setColor(Colors.Blue)
      .setTitle("YesTheory Uploaded!")
      .setDescription(
        `Yes Theory posted a new video! Go check it out in ${message.channel.toString()} and talk about it here`
      );
    await channelDiscussion.send({ embeds: [embed] });
    await Tools.forcePingGroup("YesTheoryUploads", channelDiscussion);
  }
}
