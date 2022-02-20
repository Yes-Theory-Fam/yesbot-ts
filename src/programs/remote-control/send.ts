import { Message, TextChannel, Util } from "discord.js";
import bot from "../..";
import Tools from "../../common/tools";
import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../event-distribution";
import { logger } from "./add-reaction";

@Command({
  event: DiscordEvent.MESSAGE,
  trigger: "!message",
  subTrigger: "send",
  allowedRoles: ["Support"],
  description: "This allows you to send messages using yesbot!",
})
class SendMessage implements CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message): Promise<void> {
    const words = message.content.split(" ");
    const channelId = words[2];
    const messageToSend = words.slice(3).join(" ");

    if (!channelId || !messageToSend) {
      await Tools.handleUserError(
        message,
        "Missing channelId or message to send. Syntax: `!message send {channelId} {message content}`"
      );
      return;
    }

    const channel = bot.channels.resolve(channelId) as TextChannel;

    if (!channel) {
      await Tools.handleUserError(
        message,
        "I could not find that channel! Verify the channelId"
      );
      return;
    }

    try {
      const messagesBatches = Util.splitMessage(messageToSend, { char: " " });
      for (const batch of messagesBatches) {
        await channel.send({ content: batch });
      }

      await message.delete();
    } catch (err) {
      logger.error("Failed to send custom yesbot message", err);
      await message.reply(
        "I seem to had a little hiccup while sending custom messages please verify I didn't send anything by mistake :c"
      );
    }
  }
}
