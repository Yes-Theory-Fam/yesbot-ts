import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../../event-distribution";
import {
  Message,
  MessageReaction,
  Role,
  Snowflake,
  TextChannel,
  User,
} from "discord.js";
import { maybeCreateTicket, TicketType } from "../common";
import { CountryRoleFinder } from "../../../utils/country-role-finder";
import { ChatNames } from "../../../collections/chat-names";
import { promptAndSendForApproval } from "./common";

@Command({
  event: DiscordEvent.MESSAGE,
  trigger: "!travel",
  description: "This handler is to create a travel ticket.",
  stateful: false,
})
class OpenTravelTicket implements CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message): Promise<void> {
    const channel = await maybeCreateTicket(
      message,
      TicketType.TRAVEL,
      `Hi ${message.member.toString()}, let's collect all important information for your trip!`,
      false
    );

    if (!channel) return;

    await promptAndSendForApproval(channel, message.author.id);
  }
}
