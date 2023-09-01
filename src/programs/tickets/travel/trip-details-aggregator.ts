import {
  ActionRowBuilder,
  APIRole,
  ComponentType,
  MessageComponentInteraction,
  ModalActionRowComponentBuilder,
  ModalMessageModalSubmitInteraction,
  RepliableInteraction,
  Role,
  RoleSelectMenuBuilder,
  RoleSelectMenuInteraction,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { CountryRoleFinder } from "../../../common/country-role-finder";
import { TripDetails } from "./travel-data-message-converter";

export type ModalRepliableInteraction = Extract<
  RepliableInteraction,
  { showModal: any }
>;

type TripInformation = {
  places: string;
  dates: string;
  activities: string;
};

export class TripDetailsAggregator {
  async getBoolean(
    interaction: MessageComponentInteraction | RepliableInteraction,
    prompt: string,
    customId: string
  ): Promise<{ result: boolean; interaction: StringSelectMenuInteraction }> {
    const updateFunction = (
      "update" in interaction ? interaction.update : interaction.editReply
    ).bind(interaction);

    const message = await updateFunction({
      content: prompt,
      components: [
        new ActionRowBuilder<StringSelectMenuBuilder>({
          components: [
            new StringSelectMenuBuilder({
              customId,
              placeholder: "Yes / No",
              options: [
                { label: "Yes", value: "true" },
                { label: "No", value: "false" },
              ],
            }),
          ],
        }),
      ],
    });

    const selection = await message.awaitMessageComponent({
      componentType: ComponentType.StringSelect,
    });

    return { result: selection.values[0] === "true", interaction: selection };
  }

  async selectTraveledCountries(
    interaction: MessageComponentInteraction,
    retryCount = 0
  ): Promise<{
    countries: (Role | APIRole)[];
    interaction: RoleSelectMenuInteraction;
  }> {
    const errorMessages = [
      "Select between one and three country roles you want to ping for your trip!",
      "Not quite yet! Pick one to three *country* roles, all the others won't get you there.",
      "Nope. Still not. Pick *countries* like Germany, Austria or Guam!",
    ];
    const errorIndex = (retryCount - 1) % errorMessages.length;
    const error = errorMessages[errorIndex];

    const messageContent = `${
      retryCount ? `**${error}**\n\n` : ""
    }Select the countries you want to ping (everything but country roles will be ignored). If you are headed to the US, please select one or more specific regions (see the map below for guidance). For a larger trip, split up countries in batches of 3 and make a ticket for them separately :)\n\nhttps://cdn.discordapp.com/attachments/603399775173476403/613072439500341291/unknown.png`;

    const userId = interaction.user.id;
    const message = await interaction.update({
      content: messageContent,
      components: [
        new ActionRowBuilder<RoleSelectMenuBuilder>({
          components: [
            new RoleSelectMenuBuilder({
              customId: "travel-" + userId + "-country-select",
              maxValues: 3,
              placeholder: "Countries",
            }),
          ],
        }),
      ],
    });

    const selection = await message.awaitMessageComponent({
      componentType: ComponentType.RoleSelect,
    });
    const selectedRoles = [...selection.roles.values()];
    const countryRoles = selectedRoles.filter(
      (r) =>
        CountryRoleFinder.isCountryRole(r.name, true) &&
        // We disallow the general USA role; we only want the regional ones
        !r.name.startsWith("United States of America")
    );

    if (countryRoles.length) {
      return { countries: countryRoles, interaction: selection };
    }

    return await this.selectTraveledCountries(selection, retryCount + 1);
  }

  async getTripInformation(
    interaction: ModalRepliableInteraction,
    defaultValues?: TripDetails
  ): Promise<
    TripInformation & { interaction: ModalMessageModalSubmitInteraction }
  > {
    const userId = interaction.user.id;
    const modalId = "travel-" + userId + "-trip-details";

    await interaction.showModal({
      title: "Trip Details",
      customId: modalId,
      components: [
        new ActionRowBuilder<ModalActionRowComponentBuilder>({
          components: [
            new TextInputBuilder({
              customId: "places",
              label: "What places are you traveling to",
              required: true,
              style: TextInputStyle.Short,
              value: defaultValues?.places,
            }),
          ],
        }),

        new ActionRowBuilder<ModalActionRowComponentBuilder>({
          components: [
            new TextInputBuilder({
              customId: "dates",
              label: "When are you visiting?",
              required: true,
              placeholder:
                "Be sure to include a timespan for each place traveled to! Ideally as DD.MM.YYYY.",
              style: TextInputStyle.Paragraph,
              value: defaultValues?.dates,
              maxLength: 250,
            }),
          ],
        }),

        new ActionRowBuilder<ModalActionRowComponentBuilder>({
          components: [
            new TextInputBuilder({
              customId: "activities",
              label: "What are you planning on doing there?",
              placeholder:
                "Be sure to include how the community comes into this!",
              required: true,
              style: TextInputStyle.Paragraph,
              value: defaultValues?.activities,
              maxLength: 1300,
            }),
          ],
        }),
      ],
    });

    const tenMinutes = 10 * 60 * 1000;
    const submission = await interaction.awaitModalSubmit({
      filter: (i) => i.customId === modalId,
      time: tenMinutes,
    });

    const fieldNames: (keyof TripInformation)[] = [
      "places",
      "dates",
      "activities",
    ];

    const tripDetails = Object.fromEntries(
      fieldNames.map((field) => [
        field,
        submission.fields.getTextInputValue(field),
      ])
    ) as TripInformation;

    if (!submission.isFromMessage())
      throw new Error("I don't understand this!");

    return { ...tripDetails, interaction: submission };
  }

  async getNeedsHost(
    interaction:
      | ModalMessageModalSubmitInteraction
      | MessageComponentInteraction
  ): Promise<{ needsHost: boolean; interaction: StringSelectMenuInteraction }> {
    const userId = interaction.user.id;

    const { result, interaction: confirmInteraction } = await this.getBoolean(
      interaction,
      "Do you need a host?",
      "travel-" + userId + "-needs-host"
    );

    return { needsHost: result, interaction: confirmInteraction };
  }
}
