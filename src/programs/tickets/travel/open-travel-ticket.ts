import {
  Command,
  CommandHandler,
  DiscordEvent,
  HandlerRejectedReason,
} from "../../../event-distribution";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  ComponentType,
  Guild,
  RepliableInteraction,
  StringSelectMenuInteraction,
  TextChannel,
} from "discord.js";
import { ChatNames } from "../../../collections/chat-names";
import {
  TravelDataMessageConverter,
  TripDetails,
} from "./travel-data-message-converter";
import { TripDetailsAggregator } from "./trip-details-aggregator";
import { TravelEditing } from "./travel-editing";

const enum Errors {
  NOT_IN_TWO_MONTHS = "NOT_IN_TWO_MONTHS",
}

// TODO guard for Seek Discomfort role
@Command({
  event: DiscordEvent.SLASH_COMMAND,
  root: "travel",
  description: "This handler is to create a travel ticket.",
  stateful: false,
  errors: {
    [HandlerRejectedReason.MISSING_ROLE]: `Before meeting up with people, it's probably best to let others know who you are! This command requires the 'Seek Discomfort' role which you can get by introducing yourself in #introductions!\n\nIf you already posted your introduction, make sure it's longer than just two or three sentences and give the support team some time to check it :)`,
    [Errors.NOT_IN_TWO_MONTHS]:
      "Unfortunately we only accept trips that occur within the next two months. Feel free to submit your trip once it's a bit closer in time!",
  },
})
class OpenTravelTicket implements CommandHandler<DiscordEvent.SLASH_COMMAND> {
  private detailsAggregator = new TripDetailsAggregator();

  async handle(interaction: ChatInputCommandInteraction): Promise<void> {
    const guild = interaction.guild;
    if (!guild) return;

    await interaction.deferReply({ ephemeral: true });

    const confirmInteraction = await this.confirmTwoMonthRequirement(
      interaction
    );

    const { countries, interaction: countrySelectInteraction } =
      await this.detailsAggregator.selectTraveledCountries(confirmInteraction);
    const {
      places,
      dates,
      activities,
      interaction: tripDetailsInteraction,
    } = await this.detailsAggregator.getTripInformation(
      countrySelectInteraction
    );

    const { needsHost, interaction: needsHostInteraction } =
      await this.detailsAggregator.getNeedsHost(tripDetailsInteraction);

    const userId = interaction.user.id;
    const details: TripDetails = {
      userId,
      countryRoles: countries,
      places,
      dates,
      activities,
      needsHost,
    };

    const editing = new TravelEditing();
    const { details: finalDetails, interaction: finalInteraction } =
      await editing.offerEditing(details, needsHostInteraction);

    await editing.sendApprovalMessage(finalDetails, interaction.guild);

    await finalInteraction.update({
      content:
        "I've sent everything to mods for review. Please have some patience while they are looking at it :)",
      components: [],
    });
  }

  async confirmTwoMonthRequirement(
    interaction: RepliableInteraction
  ): Promise<StringSelectMenuInteraction> {
    const userId = interaction.user.id;
    const { result, interaction: confirmInteraction } =
      await this.detailsAggregator.getBoolean(
        interaction,
        "First things first: Is your trip starting within the next two months?",
        "travel-" + userId + "-confirm-two-months"
      );

    if (!result) throw new Error(Errors.NOT_IN_TWO_MONTHS);

    return confirmInteraction;
  }
}
