import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../event-distribution";
import { Message } from "discord.js";
import { maybeCreateTicket, TicketType } from "./common";

@Command({
  event: DiscordEvent.MESSAGE,
  trigger: "!shoutout",
  description: "This handler is to create a shoutout ticket.",
})
class OpenShoutoutTicket implements CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message): Promise<void> {
    await maybeCreateTicket(
      message,
      TicketType.SHOUTOUT,
      `Hi ${message.member.toString()}, please list the details of your shoutout below.`
    );
  }
}
