import { GroupPingSetting, UserGroup } from "@yes-theory-fam/database/client";
import { Message, Util } from "discord.js";
import { ChatNames } from "../../../collections/chat-names";
import { isAuthorModerator } from "../../../common/moderator";
import Tools from "../../../common/tools";
import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../../event-distribution";
import prisma from "../../../prisma";
import {
  findManyRequestedGroups,
  logger,
  timeRemainingForDeadchat,
} from "../common";

@Command({
  event: DiscordEvent.MESSAGE,
  trigger: "",
  categoryNames: ["hobbies", "gaming"],
  channelNames: [
    ChatNames.CHAT,
    ChatNames.CHAT_TOO,
    ChatNames.FOURTH_CHAT,
    ChatNames.CHAT_FIVE,
    ChatNames.VOICE_CHAT,
    ChatNames.VOICE_CHAT_TWO,
    ChatNames.SELF_DEVELOPMENT,
    ChatNames.LEARNING_SPANISH,
    ChatNames.DAILY_CHALLENGE,
    ChatNames.YESTHEORY_DISCUSSION,
    ChatNames.PERMANENT_TESTING,
  ],
  description: "This handler is to ping all users in the group",
})
class PingGroup implements CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message): Promise<void> {
    const content = message.content.toLowerCase();
    if (!content.includes("@group")) return;

    const lines = content.split("\n");
    const unquoted = lines.filter((line) => !line.startsWith(">")).join("\n");
    const hasUnquotedGroupPing = unquoted.includes("@group");

    if (!hasUnquotedGroupPing) return;

    const groupTriggerStart = content.substring(content.indexOf("@group"));
    const args = <string[]>groupTriggerStart.split(/\s/g);

    args.shift();
    const [requestName] = args;

    const groups = await findManyRequestedGroups(requestName);
    const matchingGroups = groups.filter(
      (group: UserGroup) =>
        group.name.toLowerCase() == requestName.toLowerCase()
    );

    if (matchingGroups.length === 0) {
      await message.reply("I couldn't find that group.");
      return;
    }

    const group = matchingGroups[0];
    const timeDifference = (Date.now() - group.lastUsed.getTime()) / 1000 / 60;
    const deadChatTimeRemaining = await timeRemainingForDeadchat(
      message,
      group
    );

    const moderator = isAuthorModerator(message);
    const setting = group.groupPingSetting;

    if (setting === GroupPingSetting.MODERATOR && !moderator) {
      await Tools.handleUserError(
        message,
        "Sorry! This group is only pingable by moderators."
      );
      return;
    }

    if (setting === GroupPingSetting.BOT && !message.author.bot) {
      await Tools.handleUserError(
        message,
        "Sorry! This group is only pingable by YesBot."
      );
      return;
    }

    if (setting === GroupPingSetting.OFF) {
      await Tools.handleUserError(
        message,
        "Sorry! This group is not pingable by members."
      );
      return;
    }

    if (deadChatTimeRemaining > 0) {
      await Tools.handleUserError(
        message,
        `Chat is not dead! You can ping this group if there have been no messages in the next ${deadChatTimeRemaining} minutes.`
      );
      return;
    }

    if (timeDifference < group.cooldown) {
      const remainingCooldown = group.cooldown - Math.round(timeDifference);
      await Tools.handleUserError(
        message,
        `Sorry, this group was already pinged within the last ${group.cooldown} minutes; it's about ${remainingCooldown} minutes left until you can ping it again.`
      );
      return;
    }

    const groupPingMessage =
      `**@${group.name}**: ` +
      group.userGroupMembersGroupMembers
        .map((member) => `<@${member.groupMemberId}>`)
        .join(", ");

    const pingBatches = Util.splitMessage(groupPingMessage, { char: "," });
    for (const batch of pingBatches) {
      await message.channel.send({ content: batch });
    }

    await prisma.userGroup.update({
      where: { id: group.id },
      data: { lastUsed: new Date() },
    });
  }
}
