import { GroupPingSetting } from "@prisma/client";
import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
} from "discord.js";
import { isAuthorModerator } from "../../../common/moderator.js";
import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../../event-distribution/index.js";
import { ErrorWithParams } from "../../../event-distribution/error-detail-replacer.js";
import { timeRemainingForDeadchat } from "../common.js";
import { groupAutocomplete } from "../group-autocomplete.js";
import { GroupService } from "../group-service.js";

enum Errors {
  CHAT_NOT_DEAD = "CHAT_NOT_DEAD",
  GROUP_NOT_FOUND = "GROUP_NOT_FOUND",
  GROUP_ON_COOLDOWN = "GROUP_ON_COOLDOWN",
  NOT_PINGABLE = "NOT_PINGABLE",
  ONLY_MOD_PINGABLE = "ONLY_MOD_PINGABLE",
  ONLY_BOT_PINGABLE = "ONLY_BOT_PINGABLE",
}

enum ErrorDetails {
  DEADCHAT_TIME_REMAINING = "DEADCHAT_TIME_REMAINING",
  GROUP_COOLDOWN = "GROUP_COOLDOWN",
  REMAINING_COOLDOWN = "REMAINING_COOLDOWN",
}

@Command({
  event: DiscordEvent.SLASH_COMMAND,
  root: "group",
  subCommand: "ping",
  description: "Ping a group!",
  options: [
    {
      name: "group",
      type: ApplicationCommandOptionType.Integer,
      description: "The group you want to ping",
      required: true,
      autocomplete: groupAutocomplete,
    },
  ],
  errors: {
    [Errors.CHAT_NOT_DEAD]: `Chat is not dead! You can ping this group if there have been no messages in the next {${ErrorDetails.DEADCHAT_TIME_REMAINING}} minutes.`,
    [Errors.GROUP_ON_COOLDOWN]: `Sorry, this group was already pinged within the last {${ErrorDetails.GROUP_COOLDOWN}} minutes; it's about {${ErrorDetails.REMAINING_COOLDOWN}} minutes left until you can ping it again.`,
    [Errors.GROUP_NOT_FOUND]: "I couldn't find the group you selected",
    [Errors.NOT_PINGABLE]: "Sorry! This group is not pingable by members.",
    [Errors.ONLY_MOD_PINGABLE]:
      "Sorry! This group is only pingable by moderators.",
    [Errors.ONLY_BOT_PINGABLE]: "Sorry! This group is only pingable by YesBot.",
  },
})
class PingGroup implements CommandHandler<DiscordEvent.SLASH_COMMAND> {
  async handle(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply({ ephemeral: true });

    const groupId = interaction.options.getInteger("group")!;
    const groupService = new GroupService();

    if (!interaction.channel) return;

    const group = await groupService.getGroupById(groupId);
    if (!group) throw new Error(Errors.GROUP_NOT_FOUND);

    const moderator = isAuthorModerator(interaction);
    const setting = group.groupPingSetting;

    if (setting === GroupPingSetting.MODERATOR && !moderator) {
      throw new Error(Errors.ONLY_MOD_PINGABLE);
    }

    if (setting === GroupPingSetting.BOT && !interaction.user.bot) {
      throw new Error(Errors.ONLY_BOT_PINGABLE);
    }

    if (setting === GroupPingSetting.OFF) {
      throw new Error(Errors.NOT_PINGABLE);
    }

    const deadChatTimeRemaining = await timeRemainingForDeadchat(
      interaction.channel,
      group
    );
    if (deadChatTimeRemaining > 0) {
      throw new ErrorWithParams(Errors.CHAT_NOT_DEAD, {
        [ErrorDetails.DEADCHAT_TIME_REMAINING]: deadChatTimeRemaining,
      });
    }

    const timeDifference = (Date.now() - group.lastUsed.getTime()) / 1000 / 60;
    if (timeDifference < group.cooldown) {
      const remainingCooldown = group.cooldown - Math.round(timeDifference);

      throw new ErrorWithParams(Errors.GROUP_ON_COOLDOWN, {
        [ErrorDetails.GROUP_COOLDOWN]: group.cooldown,
        [ErrorDetails.REMAINING_COOLDOWN]: remainingCooldown,
      });
    }

    await groupService.pingGroup(group, interaction.channel);

    await interaction.editReply({ content: "Done ✅" });
  }
}
