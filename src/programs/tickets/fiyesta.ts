import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../event-distribution";
import { Message } from "discord.js";
import { maybeCreateTicket, TicketType } from "./common";

// TODO re-enable when fiyestas are back
// @Command({
//   event: DiscordEvent.MESSAGE,
//   trigger: "!fiyesta",
//   description: "This handler is to create a fiyesta ticket.",
// })
class OpenFiyestaTicket implements CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message): Promise<void> {
    await maybeCreateTicket(
      message,
      TicketType.FIYESTA,
      `Hi ${message.member.toString()}, please list the details of your proposed FiYESta below and read the <#502198786441871381> while you wait.`
    );
  }
}
