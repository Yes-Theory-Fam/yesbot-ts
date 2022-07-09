import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../../event-distribution";
import { ChatNames } from "../../../collections/chat-names";
import { GuildMember, MessageReaction, Snowflake, User } from "discord.js";
import { BuddyProjectError, commonMessages } from "../errors";
import { BuddyProjectService } from "../services/buddy-project.service";
import {
  ghostedRematchDifferenceHours,
  matchedGhostedDifferenceHours,
} from "./constants";
import { MarkGhostedError } from "../../../__generated__/types";

@Command({
  event: DiscordEvent.REACTION_ADD,
  emoji: "👻",
  channelNames: [ChatNames.BUDDY_PROJECT_INFO],
  errors: {
    ...commonMessages,
    [MarkGhostedError.AlreadyMarked]:
      "You already let me know you were ghosted! I have reached out to your buddy when you did and if I don't hear back from them in a few days, you will be rematched, no worries!",
    [MarkGhostedError.BuddyMarkedAlready]: `Heh, that's a funny one! Your buddy let me know *you* ghosted *them*! There should be a message in our DMs up here somewhere about that. If you are having trouble contacting your buddy, have a look at #${ChatNames.BUDDY_PROJECT_INFO} or send \`!rescue\` in #${ChatNames.BUDDY_PROJECT}.`,
    [MarkGhostedError.WaitedTooLittle]: `It's not been ${matchedGhostedDifferenceHours} hours since you got were matched! Give your buddy some time to respond and if they don't, come back here once ${matchedGhostedDifferenceHours} hours have passed since matching!`,
  },
})
class MarkGhostedReaction extends CommandHandler<DiscordEvent.REACTION_ADD> {
  async handle(reaction: MessageReaction, user: User): Promise<void> {
    const buddyId = await this.ensureValidEntry(user.id);
    const buddyMember = reaction.message.guild!.members.resolve(buddyId);
    await this.contactBuddy(buddyMember, user.id);
    await this.confirmToUser(user);
  }

  async ensureValidEntry(userId: Snowflake) {
    const { success, buddyId, error } =
      await new BuddyProjectService().markGhosted(userId);

    if (success) return buddyId;

    switch (error) {
      case MarkGhostedError.AlreadyMarked:
      case MarkGhostedError.BuddyMarkedAlready:
      case MarkGhostedError.WaitedTooLittle:
        throw new Error(error);
      case MarkGhostedError.NotMatched:
        throw new Error(BuddyProjectError.NOT_MATCHED);
      case MarkGhostedError.NotSignedUp:
        throw new Error(BuddyProjectError.NOT_SIGNED_UP);
    }
  }

  async contactBuddy(buddyMember: GuildMember, userId: Snowflake) {
    const dm = await buddyMember.createDM();
    const warningMessage = await dm.send(
      `**Buddy Project Ghosting**

Hey there, your buddy told me they couldn't reach you through DMs. If you are around on Discord, click the ✅ below to prevent getting removed from the Buddy Project and don't forget to reach out to <@${userId}>`
    );
    await warningMessage.react("✅");
  }

  async confirmToUser(user: User) {
    const dm = await user.createDM();
    await dm.send(
      `I contacted your buddy, they have ${ghostedRematchDifferenceHours} hours to react to my message and if they don't, you will be rematched.`
    );
  }
}
