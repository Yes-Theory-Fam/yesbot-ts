import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../event-distribution";
import { Message, TextChannel } from "discord.js";
import { closeTicket } from "./common";

@Command({
  event: DiscordEvent.MESSAGE,
  trigger: "!ticket",
  subTrigger: "forceclose",
  allowedRoles: ["Support"],
  description: "This handler is to forceclose a ticket.",
})
class ForceCloseTicket implements CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message): Promise<void> {
    const channel = message.channel as TextChannel;
    const type = channel.name.split("-")[0];
    await closeTicket(channel, message.author, type);
  }
}
