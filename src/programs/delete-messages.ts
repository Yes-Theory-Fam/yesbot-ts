import { DMChannel, Message, TextChannel } from "discord.js";
import Tools from "../common/tools";
import { Command, CommandHandler, DiscordEvent } from "../event-distribution";
import { createYesBotLogger } from "../log";

const logger = createYesBotLogger("programs", "DeleteMessages");

@Command({
  event: DiscordEvent.MESSAGE,
  trigger: "!delete",
  allowedRoles: ["Support"],
  description:
    "This handler is to delete message(s) in the requested text channel.",
})
class DeleteMessages implements CommandHandler<DiscordEvent.MESSAGE> {
  async handle(botMessage: Message): Promise<void> {
    try {
      const words = Tools.stringToWords(botMessage.content);
      words.shift();
      const messagesToDelete = Number(words[0]);
      if (
        !isNaN(messagesToDelete) &&
        !(botMessage.channel instanceof DMChannel)
      ) {
        await (botMessage.channel as TextChannel).bulkDelete(messagesToDelete);
      }
    } catch (err) {
      logger.error("Error deleting messages: ", err);
    }
  }
}
