import {
  Command,
  CommandHandler,
  DiscordEvent,
  HandlerRejectedReason,
} from "../../../event-distribution";
import { Message } from "discord.js";
import prisma from "../../../prisma";
import { ChatNames } from "../../../collections/chat-names";
import { BuddyProjectError, commonMessages } from "../errors";
import { BuddyProjectMatching } from "../matching/matching";

@Command({
  event: DiscordEvent.MESSAGE,
  allowedRoles: ["Buddy Project 2021"],
  trigger: "!buddy",
  description: "Pings the buddy of the author",
  errors: {
    ...commonMessages,
    [HandlerRejectedReason.MISSING_ROLE]:
      commonMessages[BuddyProjectError.NOT_SIGNED_UP],
  },
  channelNames: [ChatNames.BUDDY_PROJECT],
})
class FindBuddyCommand extends CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message): Promise<void> {
    const {
      member,
      author: { id: userId },
    } = message;
    const buddyEntry = await prisma.buddyProjectEntry.findUnique({
      where: {
        userId,
      },
      include: {
        buddy: true,
      },
      rejectOnNotFound: false,
    });

    if (!buddyEntry) {
      throw new Error(BuddyProjectError.NOT_SIGNED_UP);
    }

    if (!buddyEntry.buddy) {
      throw new Error(BuddyProjectError.NOT_MATCHED);
    }

    const buddyMember = await member.guild.members.fetch(buddyEntry.buddyId);
    const tag = `${buddyMember.user.username}#${buddyMember.user.discriminator}`;
    const infoChannel = member.guild.channels.cache.find(
      (c) => c.name === ChatNames.BUDDY_PROJECT_INFO
    );

    await message.reply(
      `Hey, your buddy is <@${buddyEntry.buddyId}> (${tag})! If that just shows some symbols and numbers, head here to find out how to fix that: ${infoChannel}.
If that doesn't help either, send \`!rescue\` in this channel.`
    );
  }
}
