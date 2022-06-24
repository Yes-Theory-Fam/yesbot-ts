import { Message, MessageEmbed } from "discord.js";
import Tools from "../common/tools";
import { CountryRoleFinder } from "../common/country-role-finder";
import { Command, CommandHandler, DiscordEvent } from "../event-distribution";
import { ChatNames } from "../collections/chat-names";

@Command({
  event: DiscordEvent.MESSAGE,
  trigger: "!map",
  channelNames: [ChatNames.BOT_COMMANDS],
  description: "This handler is to manage the map command",
})
class Map implements CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message) {
    await message.reply(
      `you can find the message link here: ${process.env.MAP_LINK} \nIf you want your city to be added to it, type !mapadd [city, country]`
    );
  }
}

@Command({
  event: DiscordEvent.MESSAGE,
  trigger: "!mapadd",
  channelNames: [ChatNames.BOT_COMMANDS],
  description: "This handler is to manage the mapadd command",
})
class MapAdd implements CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message) {
    const split = message.content.split(" ");
    split.shift();
    const city = split.join(" ");
    if (!city) {
      await Tools.handleUserError(
        message,
        "You need to add the city you are from!"
      );
      return;
    }

    const countries = message.member?.roles.cache
      .filter((role) => CountryRoleFinder.isCountryRole(role.name))
      .map((role) => CountryRoleFinder.getCountryByRole(role.name));

    const mapMaintainerDm = await message.guild?.members
      .resolve(process.env.MAP_ADD_DM_USER_ID)
      ?.user.createDM();
    const author = message.member;

    const dmEmbed = new MessageEmbed()
      .setTitle(`Map Update Requested`)
      .addField("UserID:", `${message.author.id}`)
      .addField("Current Name on the server:", `${author?.displayName}`)
      .addField("Current Discord Tag:", `${author?.user.tag}`)
      .addField("City / Location:", `${city}`)
      .addField("Countries:", `${countries?.join(",")}`)
      .addField("Link to the message:", `[here](${message.url})`);

    await mapMaintainerDm?.send({ embeds: [dmEmbed] });
    await message.reply(
      "I messaged the maintainer of the map, they will add you to it soon!"
    );
  }
}
