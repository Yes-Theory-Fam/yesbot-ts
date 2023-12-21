import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../../event-distribution";
import {
  ActionRowBuilder,
  ButtonInteraction,
  ComponentType,
  SelectMenuComponentOptionData,
  StringSelectMenuBuilder,
} from "discord.js";
import { PayloadService } from "../services/payload-service";
import { User_Roles_MutationInput } from "../../../__generated__/types";

const enum Errors {
  MISSING_TARGET_USER = "MISSING_TARGET_USER",
}

@Command({
  event: DiscordEvent.BUTTON_CLICKED,
  customId: "approve-payload-request",
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

    const availableRoles = Object.entries(
      User_Roles_MutationInput
    ).map<SelectMenuComponentOptionData>(([k, v]) => {
      return {
        label: k,
        value: v,
      };
    });

    const selectId = `${targetUser}-payload-roles`;
    const groupSelection = new StringSelectMenuBuilder({
      customId: selectId,
      minValues: 1,
      maxValues: 3,
      placeholder: "Roles",
      options: availableRoles,
    });
    const components = new ActionRowBuilder<StringSelectMenuBuilder>({
      components: [groupSelection],
    });
    const interactionResponse = await interaction.update({
      components: [components],
    });

    const selectInteraction = await interactionResponse.awaitMessageComponent({
      componentType: ComponentType.StringSelect,
      filter: (c) => c.customId === selectId,
    });

    const roles = selectInteraction.values as User_Roles_MutationInput[];
    await selectInteraction.deferUpdate();

    const service = new PayloadService();
    const result = await service.createUser(targetUser.id, roles);

    const originalContent = interaction.message.content;

    const success = !!result?.id;

    const newContent =
      originalContent +
      "\n\n" +
      (success
        ? "Created user ✅"
        : `Failed to create user with roles ${roles.join(", ")}`);
    await selectInteraction.editReply({ components: [], content: newContent });

    if (success) {
      await interaction.client.users.send(
        targetUser,
        `Your access to the YTF CMS has been approved. Open ${process.env.YTF_CMS_URL} to look around!`
      );
    }
  }
}
