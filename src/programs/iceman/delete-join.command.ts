import { Message } from "discord.js";
import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../event-distribution";

@Command({
  event: DiscordEvent.MESSAGE,
  trigger: "!join",
  channelNames: ["iceman-chat"],
  description: "Deletes the join command used to trigger CollabLand",
})
class DeleteJoinCommand extends CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message): Promise<void> {
    setTimeout(() => {
      message.delete().catch(() => {});
    }, 1000);
  }
}
