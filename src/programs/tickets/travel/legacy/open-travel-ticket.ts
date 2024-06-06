import {
  Command,
  CommandHandler,
  DiscordEvent,
  HandlerRejectedReason,
} from "../../../../event-distribution/index.js";
import { Message } from "discord.js";
import { maybeCreateTicket, TicketType } from "../../common.js";
import { promptAndSendForApproval } from "./common.js";

@Command({
  event: DiscordEvent.MESSAGE,
  trigger: "!travel",
  allowedRoles: ["Seek Discomfort"],
  description: "This handler is to create a travel ticket.",
  stateful: false,
  errors: {
    [HandlerRejectedReason.MISSING_ROLE]: `Before meeting up with people, it's probably best to let others know who you are! This command requires the 'Seek Discomfort' role which you can get by introducing yourself in #introductions!\n\nIf you already posted your introduction, make sure it's longer than just two or three sentences and give the support team some time to check it :)`,
  },
})
class OpenTravelTicket implements CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message): Promise<void> {
    const channel = await maybeCreateTicket(
      message,
      TicketType.TRAVEL,
      `Hi ${message.member?.toString()}, let's collect all important information for your trip!`,
      false
    );

    if (!channel) return;

    await promptAndSendForApproval(channel, message.author.id);
  }
}
