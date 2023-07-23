import {
  Command,
  CommandHandler,
  DiscordEvent,
  EventLocation,
} from "../../../event-distribution";
import { ButtonInteraction } from "discord.js";

@Command({
  event: DiscordEvent.BUTTON_CLICKED,
  customId: "travel-cancel",
  location: EventLocation.DIRECT_MESSAGE,
})
class CancelTravelButton extends CommandHandler<DiscordEvent.BUTTON_CLICKED> {
  async handle(interaction: ButtonInteraction): Promise<void> {
    await interaction.message.delete();
    await interaction.reply(
      "Feel free to open up a new travel ticket anytime using the /travel command!"
    );
  }
}
