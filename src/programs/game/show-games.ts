import { Message } from "discord.js";
import Tools from "../../common/tools";
import {
  Command,
  DiscordEvent,
  CommandHandler,
} from "../../event-distribution";
import { hub } from "./initiate-gamehub";

@Command({
  event: DiscordEvent.MESSAGE,
  trigger: "!game",
  channelNames: ["bot-games"],
  description: "This handler shows all the available games on YesBot",
})
class ShowGameEmbed implements CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message): Promise<void> {
    const embedMessage = await message.reply(hub.buildEmbed(message.author.id));
    const emojis = hub.getEmojis();

    const selection = await Tools.addVote(
      embedMessage,
      emojis,
      [message.author.id],
      true
    );

    await embedMessage.delete();

    const emoji = selection.emoji.name;
    try {
      await hub.createSession(emoji, message.author.id);
      await message.delete();
    } catch (e) {
      if (e instanceof Error) {
        await Tools.handleUserError(message, e.message);
      }
    }
  }
}
