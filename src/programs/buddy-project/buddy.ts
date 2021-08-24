import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../event-distribution";
import { Message } from "discord.js";
import prisma from "../../prisma";

@Command({
  event: DiscordEvent.MESSAGE,
  allowedRoles: ["Buddy Project 2021"],
  trigger: "!buddy",
  description: "Pings the buddy of the author",
  stateful: false,
  channelNames: /*TODO*/ ["bot-commands"],
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

    const bpRole = member.guild.roles.cache.find(
      (r) => r.name === "Buddy Project 2021"
    );

    if (!buddyEntry) {
      await message.reply(
        "It seems you have not signed up to this year's iteration of the buddy project! You can join at https://yestheory.family/buddyproject!"
      );
      await member.roles.remove(bpRole);
      return;
    }

    if (!buddyEntry.buddy) {
      await message.reply(
        "It seems you haven't been matched yet! Have some patience, I will message you with your buddy and questions once you are matched, pinky promise!"
      );
      return;
    }

    const buddyMember = await member.guild.members.fetch(buddyEntry.buddyId);
    const tag = `${buddyMember.user.username}#${buddyMember.user.discriminator}`;
    await message.reply(
      `Hey, your buddy is <@${buddyEntry.buddyId}> (${tag})! If that looks weird, head here to find out how to fix that: ` /* TODO */
    );
  }
}
