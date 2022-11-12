import { ButtonInteraction } from "discord.js";
import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../../event-distribution";
import { BuddyProjectService } from "../services/buddy-project.service";

export const buddyProjectSignUpButtonId = "buddy-project-signup";

@Command({
  event: DiscordEvent.BUTTON_CLICKED,
  customId: buddyProjectSignUpButtonId,
})
class BuddyProjectSignup extends CommandHandler<DiscordEvent.BUTTON_CLICKED> {
  async handle(interaction: ButtonInteraction): Promise<void> {
    const service = new BuddyProjectService();

    await interaction.deferReply({ ephemeral: true });

    const response = await service.signUp(interaction.user.id);

    if (response.success) {
      await interaction.editReply({
        content:
          "You have successfully signed up to the Buddy Project and will be matched soon!",
      });

      return;
    }

    await interaction.editReply({
      content: `I could not sign you up to the Buddy Project: ${
        response.error ??
        "Actually couldn't tell you why; please bother a Support about this!"
      }`,
    });
  }
}
