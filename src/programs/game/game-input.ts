import { GuildChannel, Message } from "discord.js";
import {
  Command,
  CommandHandler,
  DiscordEvent,
  EventLocation,
} from "../../event-distribution";
import { hub } from "./initiate-gamehub";

@Command({
  event: DiscordEvent.MESSAGE,
  location: EventLocation.ANYWHERE,
  description:
    "This handler is for any commands related to the available games to be routed to the Game Hub message handler.",
})
class HandleGameInput implements CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message): Promise<void> {
    if (message.channel.type == "DM") {
      hub.routeMessage(message);
      return;
    }

    const entertainmentChannel = (message.channel as GuildChannel).parent.name
      .toLocaleLowerCase()
      .endsWith("entertainment");
    if (entertainmentChannel) hub.routeMessage(message);
  }
}
