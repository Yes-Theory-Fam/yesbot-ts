import { Message } from "discord.js";
import {
  Command, CommandHandler, DiscordEvent
} from "../../../event-distribution";
import { groupInteractionAndReport, tryLeaveGroups } from "../common";

@Command({
  event: DiscordEvent.MESSAGE,
  trigger: "!group",
  subTrigger: "leave",
  channelNames: ["bot-commands", "permanent-testing"],
  description: "This handler is to leave the group",
})
class LeaveGroup implements CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message): Promise<void> {
    const words = message.content.split(" ").slice(2);
    const [requestedGroupNames, ...rest] = words;
    const member = message.member;

    await groupInteractionAndReport(
      message,
      [requestedGroupNames, ...rest],
      member,
      tryLeaveGroups
    );
  }
}
