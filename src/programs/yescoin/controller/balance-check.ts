import {
  Command,
  CommandHandler,
  DiscordEvent,
  EventLocation,
} from "../../../event-distribution";
import { Message } from "discord.js";
import { GetBalance } from "../usecase/get-balance";

@Command({
  event: DiscordEvent.MESSAGE,
  location: EventLocation.DIRECT_MESSAGE,
  trigger: "!yescoin-status",
  description: "This handler return the balance of user",
})
export class BalanceCheck implements CommandHandler<DiscordEvent.MESSAGE> {
  public async handle(arg: Message): Promise<void> {
    const member = arg.author;
    await GetBalance.instance()
      .handle(member.id)
      .then((value) => {
        arg.channel.send(
          `You currently ${value}${arg.client.emojis.cache.find(
            (value) => value.name === "yescoin"
          )}`
        );
      });
    return;
  }
}
