import { Message } from "discord.js";
import {
  Command,
  DiscordEvent,
  CommandHandler,
} from "../../event-distribution";
import { groupInteractionAndReport, tryJoinGroups } from "./common";

@Command({
  event: DiscordEvent.MESSAGE,
  trigger: "!group",
  subTrigger: "join",
  channelNames: ["bot-commands"],
  description: "This handler is to join a group",
})
class JoinGroup implements CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message): Promise<void> {
    const words = message.content.split(" ").slice(2);
    const [requestedGroupNames, ...rest] = words;
    const member = message.member;

    await groupInteractionAndReport(
      message,
      [requestedGroupNames, ...rest],
      member,
      tryJoinGroups
    );
  }
}
