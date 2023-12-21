import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../../event-distribution";
import { ButtonInteraction, StringSelectMenuBuilder } from "discord.js";
import { PayloadService } from "../services/payload-service";

const enum Errors {
  MISSING_TARGET_USER = "MISSING_TARGET_USER",
}

@Command({
  event: DiscordEvent.BUTTON_CLICKED,
  customId: "decline-payload-request",
  errors: {
    [Errors.MISSING_TARGET_USER]:
      "Could not parse the target user id. You might have to do this manually, sorry!",
  },
})
class PayloadAccessRequestApprovalButton extends CommandHandler<DiscordEvent.BUTTON_CLICKED> {
  async handle(interaction: ButtonInteraction): Promise<void> {
    const targetUser = interaction.message.mentions.parsedUsers.first();

    if (!targetUser) {
      throw new Error(Errors.MISSING_TARGET_USER);
    }

    const newContent = interaction.message.content + "\n\n Declined ❌";
    await interaction.update({ components: [], content: newContent });

    await interaction.client.users.send(
      targetUser,
      "Your request for access to the YTF CMS has been declined. If you believe this was a mistake, please reach out to Support staff of the Yes Fam server!"
    );
  }
}
