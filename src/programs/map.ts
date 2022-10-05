import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import { Command, CommandHandler, DiscordEvent } from "../event-distribution";
import { ChatNames } from "../collections/chat-names";
import { CountryRoleFinder } from "../common/country-role-finder";

@Command({
  event: DiscordEvent.SLASH_COMMAND,
  root: "map",
  subCommand: "show",
  channelNames: [ChatNames.BOT_COMMANDS],
  description: "This handler is to manage the map command",
})
class Map implements CommandHandler<DiscordEvent.SLASH_COMMAND> {
  async handle(interaction: ChatInputCommandInteraction) {
    await interaction.reply({
      content: `you can find the message link here: ${process.env.MAP_LINK} \nIf you want your city to be added to it, use </map add:${interaction.commandId}> command`,
      ephemeral: true,
    });
  }
}

@Command({
  event: DiscordEvent.SLASH_COMMAND,
  root: "map",
  subCommand: "add",
  channelNames: [ChatNames.BOT_COMMANDS],
  description: "This handler is to manage the map add command",
  options: [
    {
      type: ApplicationCommandOptionType.String,
      name: "city",
      description: "City",
      required: true,
    },
    {
      type: ApplicationCommandOptionType.String,
      name: "country",
      description: "Country",
    },
  ],
})
class MapAdd implements CommandHandler<DiscordEvent.SLASH_COMMAND> {
  async handle(interaction: ChatInputCommandInteraction) {
    const city = interaction.options.getString("city");
    const country = interaction.options.getString("country");
    const member = await interaction.guild?.members.fetch(interaction.user.id);

    const countries = member?.roles.cache
      .filter((role) => CountryRoleFinder.isCountryRole(role.name))
      .map((role) => CountryRoleFinder.getCountryByRole(role.name));

    const mapMaintainerDm = await interaction.guild?.members
      .resolve(process.env.MAP_ADD_DM_USER_ID)
      ?.user.createDM();

    const dmEmbed = new EmbedBuilder()
      .setTitle("Map Update Requested")
      .setFields([
        { name: "UserID:", value: interaction.user.id },
        {
          name: "Current Name on the Server:",
          value: member?.displayName ?? "",
        },
        { name: "Current Discord Tag:", value: interaction.user.tag },
        { name: "City:", value: city ?? "" },
        { name: "Countries:", value: (country || countries?.join(",")) ?? "" },
      ]);

    await mapMaintainerDm?.send({ embeds: [dmEmbed] });
    await interaction.reply({
      content:
        "I messaged the maintainer of the map, they will add you to it soon!",
      ephemeral: true,
    });
  }
}
