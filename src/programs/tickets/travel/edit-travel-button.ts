import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../../event-distribution/index.js";
import { ButtonInteraction } from "discord.js";
import { TravelEditing } from "./travel-editing.js";
import { TravelDataMessageConverter } from "./travel-data-message-converter.js";

@Command({
  event: DiscordEvent.BUTTON_CLICKED,
  customId: "travel-edit",
})
class EditTravelButton extends CommandHandler<DiscordEvent.BUTTON_CLICKED> {
  async handle(interaction: ButtonInteraction): Promise<void> {
    const editing = new TravelEditing();
    const guild = interaction.client.guilds.resolve(process.env.GUILD_ID);

    if (!guild) throw new Error("Yeet");

    const details = TravelDataMessageConverter.fromMessage(
      interaction.message,
      guild
    );

    const { details: finalDetails, interaction: editInteraction } =
      await editing.doEditing(details, interaction, false);
    await editing.sendApprovalMessage(finalDetails, guild);

    await editInteraction.update({
      content:
        "I've sent everything to the mods! Have some patience while they take a look at the updates :)",
      components: [],
    });
  }
}
