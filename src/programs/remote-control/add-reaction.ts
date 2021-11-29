import { Message, TextChannel } from "discord.js";
import bot from "../..";
import Tools from "../../common/tools";
import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../event-distribution";
import { createYesBotLogger } from "../../log";

export const logger = createYesBotLogger("programs", "remote-control");

@Command({
  event: DiscordEvent.MESSAGE,
  trigger: "!message",
  subTrigger: "reactAdd",
  allowedRoles: ["Support"],
  description: "This commands allows you to add reactions to any messages!",
})
class AddReactions implements CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message): Promise<void> {
    const [, , channelId, messageId, reaction] = message.content.split(" ");

    if (!channelId || !messageId || !reaction) {
      await Tools.handleUserError(
        message,
        "Missing channelId or messageId or emoji. Syntax: `!message reactAdd channelId messageId emoji"
      );
      return;
    }

    const channel = bot.channels.resolve(channelId) as TextChannel;
    const messageRequested = channel.messages.resolve(messageId);

    if (!channel || !messageRequested) {
      await Tools.handleUserError(
        message,
        "I could not find that channel or message! Please verify the arguments given"
      );
      return;
    }

    try {
      await messageRequested.react(reaction);
      await message.react("👍");
    } catch (err) {
      logger.error("Failed to add reaction to message", err);
      await message.react("👎");
    }
  }
}
