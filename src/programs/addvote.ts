import { Message } from "discord.js";
import Tools from "../common/tools";
import { Command, CommandHandler, DiscordEvent } from "../event-distribution";
import { createYesBotLogger } from "../log";

const logger = createYesBotLogger("programs", "AddVote");

// TODO make this a message context menu command

@Command({
  event: DiscordEvent.MESSAGE,
  trigger: "!addvote",
  description:
    "This handler is to add to any requested changes the two reactions thumbs reaction to convert to a poll",
})
class AddVote implements CommandHandler<DiscordEvent.MESSAGE> {
  async handle(botMessage: Message): Promise<void> {
    try {
      const words = Tools.stringToWords(botMessage.content);
      words.shift();
      const messageId = words[0];
      const messageToVote = await botMessage.channel.messages.resolve(
        messageId
      );
      if (!messageToVote) botMessage.react("👎");
      else
        botMessage
          .delete()
          .then(() => messageToVote.react("👍"))
          .then(() => messageToVote.react("👎"))
          .catch(() => {});
    } catch (err) {
      logger.error("Error adding voting: ", err);
    }
  }
}
