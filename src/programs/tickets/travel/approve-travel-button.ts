import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../../event-distribution";
import { ButtonInteraction, TextChannel } from "discord.js";
import { ChatNames } from "../../../collections/chat-names";
import { TravelDataMessageConverter } from "./travel-data-message-converter";

@Command({
  event: DiscordEvent.BUTTON_CLICKED,
  customId: "travel-approve",
})
class ApproveTravelButton extends CommandHandler<DiscordEvent.BUTTON_CLICKED> {
  async handle(interaction: ButtonInteraction): Promise<void> {
    const message = interaction.message;
    const details = TravelDataMessageConverter.fromMessage(
      message,
      interaction.guild!
    );

    // Remove buttons as early as possible before someone else votes as well
    // TODO Fix displayname
    const approver = interaction.user.username;
    const newContent =
      message.content +
      `

Approved by ${approver}`;
    await message.edit({ content: newContent, components: [] });

    const travelChannel = interaction.guild?.channels.cache.find(
      (c): c is TextChannel => c.name === ChatNames.TRAVELING_TOGETHER
    );

    const messageWithMentions = TravelDataMessageConverter.toMessage(
      details,
      true
    );

    const travelPost =
      messageWithMentions +
      "\n\nClick on the thread right below this line if you're interested to join the chat and talk about it 🙂";
    await travelChannel?.send(travelPost);
    // TODO start thread with correct name
  }
}
