import { Message } from "discord.js";
import { BuddyProjectStatus } from "../../../__generated__/types";
import { ChatNames } from "../../../collections/chat-names";
import { RoleNames } from "../../../collections/role-names";
import {
  Command,
  CommandHandler,
  DiscordEvent,
  HandlerRejectedReason,
} from "../../../event-distribution";
import { BuddyProjectError, commonMessages } from "../errors";
import { BuddyProjectService } from "../services/buddy-project.service";

@Command({
  event: DiscordEvent.MESSAGE,
  allowedRoles: [RoleNames.BUDDY_PROJECT],
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
    if (!member) return;

    const { buddy, status } = await new BuddyProjectService().getBuddy(userId);

    if (status === BuddyProjectStatus.NotSignedUp) {
      throw new Error(BuddyProjectError.NOT_SIGNED_UP);
    }

    if (!buddy) {
      throw new Error(BuddyProjectError.NOT_MATCHED);
    }

    const { userId: buddyId } = buddy;

    const buddyMember = await member.guild.members.fetch(buddyId);
    const tag = `${buddyMember.user.username}#${buddyMember.user.discriminator}`;
    const infoChannel = member.guild.channels.cache.find(
      (c) => c.name === ChatNames.BUDDY_PROJECT_INFO
    );

    await message.reply(
      `Hey, your buddy is <@${buddyId}> (${tag})! If that just shows some symbols and numbers, head here to find out how to fix that: ${infoChannel}.
If that doesn't help either, send \`!rescue\` in this channel.`
    );
  }
}
