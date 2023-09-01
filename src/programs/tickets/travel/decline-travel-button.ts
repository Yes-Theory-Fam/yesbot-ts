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
  ModalSubmitInteraction,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import {
  TravelDataMessageConverter,
  TripDetails,
} from "./travel-data-message-converter";

@Command({
  event: DiscordEvent.BUTTON_CLICKED,
  customId: "travel-decline",
})
class DeclineTravelButton extends CommandHandler<DiscordEvent.BUTTON_CLICKED> {
  async handle(interaction: ButtonInteraction): Promise<void> {
    const message = interaction.message;
    const originalMessage = message.content;
    const guild = interaction.guild!;
    const details = TravelDataMessageConverter.fromMessage(message, guild);

    const member = guild.members.resolve(interaction.user.id);
    if (!member) throw new Error("Could not resolve approving member!");

    const decliner = member.displayName;
    const newContent =
      message.content + `\n\n${decliner} is currently declining...`;
    await message.edit({ content: newContent });

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
    try {
      const submission = await interaction.awaitModalSubmit({
        time: 5 * 60 * 1000,
        filter: (i) => i.customId === modalId,
      });

      await this.declineWithReason(submission, originalMessage, details);
    } catch {
      await interaction.update({ content: originalMessage });
    }
  }

  async declineWithReason(
    submission: ModalSubmitInteraction,
    originalMessage: string,
    details: TripDetails
  ) {
    const reason = submission.fields.getTextInputValue("reason").trim();
    if (!submission.isFromMessage()) return;
    const guild = submission.guild!;
    const member = guild.members.resolve(submission.user.id);
    if (!member) throw new Error("Could not resolve approving member!");

    const decliner = member.displayName;

    if (!reason) {
      await submission.update({ content: originalMessage });
      return;
    }

    await submission.update({
      content:
        originalMessage + `\n\nDeclined by ${decliner}\nReason: ${reason}`,
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

    const dm = await submission.client.users.createDM(details.userId);
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
