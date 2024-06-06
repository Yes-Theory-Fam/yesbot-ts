import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../../event-distribution/index.js";
import {
  ActionRowBuilder,
  ButtonInteraction,
  ComponentType,
  SelectMenuComponentOptionData,
  StringSelectMenuBuilder,
} from "discord.js";
import { PayloadService } from "../services/payload-service.js";
import { User_Roles_MutationInput } from "../../../__generated__/types.js";
import { approvalResponses } from "./approval-responses.js";
import { ErrorDetailReplacer } from "../../../event-distribution/error-detail-replacer.js";

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
    ).map<SelectMenuComponentOptionData>(([k, v]) => ({ label: k, value: v }));

    const selectId = `${targetUser}-payload-roles`;
    const roleSelection = new StringSelectMenuBuilder({
      customId: selectId,
      minValues: 1,
      maxValues: 3,
      placeholder: "Roles",
      options: availableRoles,
    });
    const components = new ActionRowBuilder<StringSelectMenuBuilder>({
      components: [roleSelection],
    });
    const interactionResponse = await interaction.update({
      components: [components],
    });

    const roleSelectInteraction =
      await interactionResponse.awaitMessageComponent({
        componentType: ComponentType.StringSelect,
        filter: (c) => c.customId === selectId,
      });

    const roles = roleSelectInteraction.values as User_Roles_MutationInput[];
    await roleSelectInteraction.deferUpdate();

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

    if (!success) {
      await roleSelectInteraction.editReply({
        components: [],
        content: newContent,
      });

      return;
    }

    const addedInfoOptions = Object.entries(approvalResponses).map(
      ([k, v]) => ({ label: v.label, value: k })
    );
    const addedInfoSelectionId = `added-info-select-${targetUser.id}`;
    const addedInfoSelectionComponents =
      new ActionRowBuilder<StringSelectMenuBuilder>({
        components: [
          new StringSelectMenuBuilder({
            customId: addedInfoSelectionId,
            options: addedInfoOptions,
          }),
        ],
      });

    const message = await roleSelectInteraction.editReply({
      components: [addedInfoSelectionComponents],
      content: newContent + "\nAny additional Info you want to send?",
    });
    const additionalInfoSelection = await message.awaitMessageComponent({
      componentType: ComponentType.StringSelect,
      filter: (c) => c.customId === addedInfoSelectionId,
    });
    const infoKey = additionalInfoSelection
      .values[0] as keyof typeof approvalResponses;
    const additionalInfo = approvalResponses[infoKey].content;
    const replacedAdditionalInfo =
      ErrorDetailReplacer.replaceErrorDetails(additionalInfo);

    await interaction.client.users.send(
      targetUser,
      `Your access to the YTF CMS has been approved. Open ${
        process.env.YTF_CMS_URL
      } to look around!${
        replacedAdditionalInfo ? "\n\n" + replacedAdditionalInfo : ""
      }`
    );

    await additionalInfoSelection.update({
      components: [],
      content: newContent,
    });
  }
}
