import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../../event-distribution";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { TravelDataMessageConverter } from "./travel-data-message-converter";

@Command({
  event: DiscordEvent.BUTTON_CLICKED,
  customId: "travel-decline",
})
class DeclineTravelButton extends CommandHandler<DiscordEvent.BUTTON_CLICKED> {
  async handle(interaction: ButtonInteraction): Promise<void> {
    const message = interaction.message;
    const originalMessage = message.content;
    const details = TravelDataMessageConverter.fromMessage(
      message,
      interaction.guild!
    );

    // Remove buttons as early as possible before someone else votes as well
    // TODO Fix displayname
    const decliner = interaction.user.username;
    const newContent =
      message.content +
      `

Declined by ${decliner}`;
    await message.edit({ content: newContent, components: [] });

    const { userId } = details;

    const reasonInput = new ActionRowBuilder<TextInputBuilder>({
      components: [
        new TextInputBuilder({
          customId: "reason",
          style: TextInputStyle.Paragraph,
          required: true,
          label: "Reason",
        }),
      ],
    });

    const modalId = "travel-decline-reason-" + userId;
    await interaction.showModal({
      title: "Decline reason",
      customId: modalId,
      components: [reasonInput],
    });
    const submission = await interaction.awaitModalSubmit({
      time: 5 * 60 * 1000,
      filter: (i) => i.customId === modalId,
    });

    const reason = submission.fields.getTextInputValue("reason");

    // TODO enforce content in modal!

    if (!submission.isFromMessage()) return;
    await submission.update({
      content: newContent + `\nReason: ${reason}`,
      components: [],
    });

    const editButtonId = "travel-edit";
    const editButton = new ButtonBuilder({
      label: "Edit",
      style: ButtonStyle.Primary,
      customId: editButtonId,
      emoji: "✏",
    });

    const cancelButtonId = "travel-cancel";
    const cancelButton = new ButtonBuilder({
      label: "Cancel",
      style: ButtonStyle.Danger,
      customId: cancelButtonId,
    });

    const dm = await interaction.client.users.createDM(details.userId);
    await dm.send({
      content: `Hello there! A moderator has declined your travel ticket with the following reason: ${reason}

This was your submission:
---
${originalMessage}
---
You can edit or cancel your ticket:
      `,
      components: [
        new ActionRowBuilder<ButtonBuilder>({
          components: [editButton, cancelButton],
        }),
      ],
    });
  }
}
