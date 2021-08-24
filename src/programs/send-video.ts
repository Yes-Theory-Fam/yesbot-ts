import { Message } from "discord.js";
import { Command, CommandHandler, DiscordEvent } from "../event-distribution";

@Command({
  event: DiscordEvent.MESSAGE,
  trigger: "!video",
  channelNames: ["welcome-chat"],
  description:
    "This handler is to send the Youtube video in the Welcome Chat to new users.",
})
class SendVideo implements CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message) {
    await message.channel.send("https://youtu.be/v-JOe-xqPN0");
  }
}
