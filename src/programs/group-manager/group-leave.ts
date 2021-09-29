import { Message } from "discord.js";
import {
  Command,
  DiscordEvent,
  CommandHandler,
} from "../../event-distribution";
import { groupInteractionAndReport, tryLeaveGroups } from "./common";

@Command({
  event: DiscordEvent.MESSAGE,
  trigger: "!group",
  subTrigger: "leave",
  channelNames: ["bot-commands"],
  description: "This",
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
