import {
  Guild,
  Message,
  MessageContextMenuCommandInteraction,
} from "discord.js";
import Tools from "../common/tools";
import eventDistribution, {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../event-distribution";
import { createYesBotLogger } from "../log";

@Command({
  event: DiscordEvent.CONTEXT_MENU_MESSAGE,
  name: "Add vote",
})
class AddVote implements CommandHandler<DiscordEvent.CONTEXT_MENU_MESSAGE> {
  async handle(command: MessageContextMenuCommandInteraction): Promise<void> {
    const message = command.targetMessage;

    await message.react("👍");
    await message.react("👎");

    await command.reply({ ephemeral: true, content: "Done!" });
  }
}
