import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  GuildMember,
  Snowflake,
} from "discord.js";
import { MarkGhostedError } from "../../../__generated__/types";
import { ChatNames } from "../../../collections/chat-names";
import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../../event-distribution";
import { BuddyProjectError, commonMessages } from "../errors";
import { BuddyProjectService } from "../services/buddy-project.service";
import {
  ghostedRematchDifferenceHours,
  matchedGhostedDifferenceHours,
} from "./constants";
import { buddyProjectNotifyNotGhostingButtonId } from "./notify-not-ghosting";

export const buddyProjectMarkGhostedButtonId = "buddy-project-mark-ghosted";

@Command({
  event: DiscordEvent.BUTTON_CLICKED,
  customId: buddyProjectMarkGhostedButtonId,
  errors: {
    ...commonMessages,
    [MarkGhostedError.AlreadyMarked]:
      "You already let me know you were ghosted! I have reached out to your buddy when you did and if I don't hear back from them in a few days, you will be rematched, no worries!",
    [MarkGhostedError.BuddyMarkedAlready]: `Heh, that's a funny one! Your buddy let me know *you* ghosted *them*! There should be a message in our DMs up here somewhere about that. If you are having trouble contacting your buddy, have a look at #${ChatNames.BUDDY_PROJECT_INFO} or use |/buddy-project rescue|.`,
    [MarkGhostedError.WaitedTooLittleAfterMatch]: `It's not been ${matchedGhostedDifferenceHours} hours since you got were matched! Give your buddy some time to respond and if they don't, come back here once ${matchedGhostedDifferenceHours} hours have passed since matching!`,
    [MarkGhostedError.WaitedTooLittleAfterGhost]: `It's not been ${matchedGhostedDifferenceHours} hours since your buddy confirmed they were not ghosting you! Give your buddy some time to respond and if they don't, come back here once ${matchedGhostedDifferenceHours} hours have passed after I told you your buddy was there!`,
    [MarkGhostedError.MarkedTooOften]: `Hey, it seems like you are having bigger troubles connecting with your buddy. Please contact a Support member for assistance!`,
  },
})
class MarkGhostedReaction extends CommandHandler<DiscordEvent.BUTTON_CLICKED> {
  async handle(interaction: ButtonInteraction): Promise<void> {
    const { user, message } = interaction;

    const buddyId = await this.ensureValidEntry(user.id);
    const buddyMember = message.guild!.members.resolve(buddyId ?? "");

    if (!buddyMember) {
      throw new Error(BuddyProjectError.NOT_MATCHED);
    }

    await this.contactBuddy(buddyMember, user.id);
    await interaction.reply({
      content: `I contacted your buddy, they have ${ghostedRematchDifferenceHours} hours to react to my message and if they don't, you will be rematched.`,
      ephemeral: true,
    });
  }

  async ensureValidEntry(userId: Snowflake) {
    const { success, buddyId, error } =
      await new BuddyProjectService().markGhosted(userId);

    if (success) return buddyId;

    switch (error) {
      case MarkGhostedError.NotMatched:
        throw new Error(BuddyProjectError.NOT_MATCHED);
      case MarkGhostedError.NotSignedUp:
        throw new Error(BuddyProjectError.NOT_SIGNED_UP);
      default:
        throw new Error(error ?? undefined);
    }
  }

  async contactBuddy(buddyMember: GuildMember, userId: Snowflake) {
    const dm = await buddyMember.createDM();

    const button = new ButtonBuilder({
      style: ButtonStyle.Success,
      emoji: "✅",
      label: "I'm here!",
      custom_id: buddyProjectNotifyNotGhostingButtonId,
    });

    const components = new ActionRowBuilder<ButtonBuilder>({
      components: [button],
    });

    await dm.send({
      content: `**Buddy Project Ghosting**

Hey there, your buddy told me they couldn't reach you through DMs. If you are around on Discord, click the button below to prevent getting removed from the Buddy Project and don't forget to reach out to <@${userId}>`,
      components: [components],
    });
  }
}
