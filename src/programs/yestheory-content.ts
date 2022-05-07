import Discord, { Message, TextChannel, Util } from "discord.js";
import { ChatNames } from "../collections/chat-names";
import { Command, CommandHandler, DiscordEvent } from "../event-distribution";
import { findManyRequestedGroups } from "./group-manager/common";
import prisma from "../prisma";
import { createYesBotLogger } from "../log";

const logger = createYesBotLogger("programs", "yestheorycontent");

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

    const yestheoryUploadNotiGroup = (
      await findManyRequestedGroups("YesTheoryUploads")
    )[0];
    const groupPingMessage =
      `**@${yestheoryUploadNotiGroup.name}**: ` +
      yestheoryUploadNotiGroup.userGroupMembersGroupMembers
        .map((member) => `<@${member.groupMemberId}>`)
        .join(", ");

    const pingBatches = Util.splitMessage(groupPingMessage, { char: "," });

    try {
      await channelDiscussion.send({ embeds: [embed] });

      for (const batch of pingBatches) {
        await channelDiscussion.send({ content: batch });
      }

      await prisma.userGroup.update({
        where: { id: yestheoryUploadNotiGroup.id },
        data: { lastUsed: new Date() },
      });
    } catch (err) {
      logger.error(
        "(pingYestheoryContent) There was an error pinging users about a new video: ",
        err
      );
    }
  }
}
