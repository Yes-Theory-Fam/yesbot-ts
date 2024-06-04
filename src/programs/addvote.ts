import { MessageContextMenuCommandInteraction } from "discord.js";
import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../event-distribution/index.js";

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
