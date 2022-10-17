import { ChatInputCommandInteraction } from "discord.js";
import { Command, CommandHandler, DiscordEvent } from "../event-distribution";

@Command({
  event: DiscordEvent.SLASH_COMMAND,
  root: "video",
  description: "To send the Youtube video to new users.",
})
class SendVideo implements CommandHandler<DiscordEvent.SLASH_COMMAND> {
  async handle(interaction: ChatInputCommandInteraction) {
    await interaction.reply("https://youtu.be/v-JOe-xqPN0");
  }
}
