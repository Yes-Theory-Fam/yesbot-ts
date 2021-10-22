import {
  Command,
  CommandHandler,
  DiscordEvent,
  HandlerRejectedReason,
} from "../../event-distribution";
import { Message } from "discord.js";
import prisma from "../../prisma";
import { ChatNames } from "../../collections/chat-names";

enum BuddyErrors {
  NOT_SIGNED_UP = "NOT_SIGNED_UP",
  NOT_MATCHED = "NOT_MATCHED",
}

@Command({
  event: DiscordEvent.MESSAGE,
  allowedRoles: ["Buddy Project 2021"],
  trigger: "!buddy",
  description: "Pings the buddy of the author",
  stateful: false,
  errors: {
    [HandlerRejectedReason.MISSING_ROLE]:
      "It seems you have not signed up to this year's iteration of the buddy project! You can join at https://yestheory.family/buddyproject !",
    [BuddyErrors.NOT_SIGNED_UP]:
      "It seems you have not signed up to this year's iteration of the buddy project! You can join at https://yestheory.family/buddyproject !",
    [BuddyErrors.NOT_MATCHED]:
      "It seems you haven't been matched yet! Have some patience, I will message you with your buddy and questions once you are matched, pinky promise!",
  },
  channelNames: [ChatNames.BUDDY_PROJECT],
})
class BuddyCommand extends CommandHandler<DiscordEvent.MESSAGE> {
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
      throw new Error(BuddyErrors.NOT_SIGNED_UP);
    }

    if (!buddyEntry.buddy) {
      throw new Error(BuddyErrors.NOT_MATCHED);
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
