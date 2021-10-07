import { Message } from "discord.js";
import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../../event-distribution";
import { ChatNames } from "../../../collections/chat-names";
import { GetBalance } from "../usecase/get-balance";

@Command({
  event: DiscordEvent.MESSAGE,
  allowedRoles: ["Support", "Developer"],
  channelNames: [ChatNames.BOT_DEVELOPMENT],
  trigger: "!yescoin-status",
  description: "This handler return the balance of mentioned users",
})
export class AdminBalanceCheck implements CommandHandler<DiscordEvent.MESSAGE> {
  public async handle(arg: Message): Promise<void> {
    let member = arg.mentions.users.first();
    if (!member) {
      member = arg.author;
    }
    await GetBalance.instance()
      .handle(member.id)
      .then((value) => {
        arg.channel.send(
          `<@${member.id}> has currently ${value}${arg.client.emojis.cache.find(
            (value) => value.name === "yescoin"
          )}`
        );
      });
    return;
  }
}
