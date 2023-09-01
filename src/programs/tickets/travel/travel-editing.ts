import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  Guild,
  MessageComponentInteraction,
  ModalMessageModalSubmitInteraction,
  SelectMenuComponentOptionData,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  TextChannel,
} from "discord.js";
import {
  TravelDataMessageConverter,
  TripDetails,
} from "./travel-data-message-converter";
import {
  ModalRepliableInteraction,
  TripDetailsAggregator,
} from "./trip-details-aggregator";
import { ChatNames } from "../../../collections/chat-names";

type EditResult = {
  details: TripDetails;
  interaction: MessageComponentInteraction | ModalMessageModalSubmitInteraction;
};

const enum EditablePropertyGroupNames {
  COUNTRIES = "COUNTRIES",
  DETAILS = "DETAILS",
  NEEDS_HOST = "NEEDS_HOST",
}

export class TravelEditing {
  private detailsAggregator = new TripDetailsAggregator();

  async offerEditing(
    details: TripDetails,
    interaction:
      | MessageComponentInteraction
      | ModalMessageModalSubmitInteraction
  ): Promise<EditResult> {
    const userId = interaction.user.id;

    const detailsMessage = TravelDataMessageConverter.toMessage(details);

    const editId = "travel-" + userId + "-result-edit";
    const doneId = "travel-" + userId + "-result-done";
    const choiceButtons = new ActionRowBuilder<ButtonBuilder>({
      components: [
        new ButtonBuilder({
          customId: doneId,
          style: ButtonStyle.Success,
          label: "Yes!",
        }),
        new ButtonBuilder({
          customId: editId,
          style: ButtonStyle.Danger,
          label: "No, let me edit",
        }),
      ],
    });

    const message = await interaction.update({
      content: `This is what I would send to mods to review:\n${detailsMessage}`,
      components: [choiceButtons],
    });

    const buttonInteraction = await message.awaitMessageComponent({
      componentType: ComponentType.Button,
    });

    switch (buttonInteraction.customId) {
      case editId:
        return await this.doEditing(details, buttonInteraction);
      case doneId:
        return { details, interaction: buttonInteraction };
      default:
        throw new Error("Invalid selection!");
    }
  }

  async doEditing(
    details: TripDetails,
    interaction: MessageComponentInteraction,
    countriesEnabled = true
  ) {
    const options: SelectMenuComponentOptionData[] = [
      {
        label: "Details",
        description:
          "Edit anything in the details (i.e. specific places, dates and activities).",
        value: EditablePropertyGroupNames.DETAILS,
      },
      {
        label: "Need host",
        description: "Change whether you need a host or not",
        value: EditablePropertyGroupNames.NEEDS_HOST,
      },
    ];

    if (countriesEnabled) {
      options.unshift({
        label: "Countries",
        description: "Re-select the countries included in your post.",
        value: EditablePropertyGroupNames.COUNTRIES,
      });
    }
    const editedPropertySelection =
      new ActionRowBuilder<StringSelectMenuBuilder>({
        components: [
          new StringSelectMenuBuilder({
            customId: "editable-property-selection",
            options,
          }),
        ],
      });

    const reply = await interaction.update({
      components: [editedPropertySelection],
    });

    const selectionInteraction = await reply.awaitMessageComponent({
      componentType: ComponentType.StringSelect,
    });

    const { details: newDetails, interaction: newDetailsInteraction } =
      await this.getNewDetails(details, selectionInteraction);

    return await this.offerEditing(newDetails, newDetailsInteraction);
  }

  private async getNewDetails(
    details: TripDetails,
    interaction: StringSelectMenuInteraction
  ): Promise<EditResult> {
    const selection = interaction.values[0];

    switch (selection) {
      case EditablePropertyGroupNames.COUNTRIES:
        return await this.editCountries(details, interaction);
      case EditablePropertyGroupNames.DETAILS:
        return await this.editInformation(details, interaction);
      case EditablePropertyGroupNames.NEEDS_HOST:
        return await this.editNeedsHost(details, interaction);
      default:
        throw new Error("Invalid selection!");
    }
  }

  async editCountries(
    details: TripDetails,
    interaction: MessageComponentInteraction
  ): Promise<EditResult> {
    const { countries, interaction: countryInteraction } =
      await this.detailsAggregator.selectTraveledCountries(interaction);

    return {
      details: { ...details, countryRoles: countries },
      interaction: countryInteraction,
    };
  }

  async editInformation(
    details: TripDetails,
    interaction: ModalRepliableInteraction
  ): Promise<EditResult> {
    const { interaction: informationInteraction, ...information } =
      await this.detailsAggregator.getTripInformation(interaction, details);

    return {
      details: { ...details, ...information },
      interaction: informationInteraction,
    };
  }

  async editNeedsHost(
    details: TripDetails,
    interaction: MessageComponentInteraction
  ): Promise<EditResult> {
    const { needsHost, interaction: needsHostInteration } =
      await this.detailsAggregator.getNeedsHost(interaction);

    return {
      details: { ...details, needsHost },
      interaction: needsHostInteration,
    };
  }

  async sendApprovalMessage(details: TripDetails, guild: Guild) {
    const approvalChannel = guild.channels.cache.find(
      (c): c is TextChannel => c.name === ChatNames.TRAVEL_APPROVALS
    );

    const approvalButtons = new ActionRowBuilder<ButtonBuilder>({
      components: [
        new ButtonBuilder({
          customId: "travel-approve",
          style: ButtonStyle.Success,
          label: "Approve",
        }),
        new ButtonBuilder({
          customId: "travel-decline",
          style: ButtonStyle.Danger,
          label: "Decline",
        }),
      ],
    });

    const message = TravelDataMessageConverter.toMessage(details);
    await approvalChannel?.send({
      content: message,
      components: [approvalButtons],
    });
  }
}
