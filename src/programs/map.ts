import { Message } from "discord.js";
import Tools from "../common/tools";
import { Command, CommandHandler, DiscordEvent } from "../event-distribution";
import { CountryRoleFinder } from "../utils/country-role-finder";

@Command({
  event: DiscordEvent.MESSAGE,
  trigger: "!map",
  channelNames: ["bot-commands"],
  description: "map to new event system",
})
class ShowMap implements CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message): Promise<void> {
    const map = async (message: Message) => {
      await message.reply(
        "you can find the map here: " +
          process.env.MAP_LINK +
          "\nIf you want to be added to it, type !mapadd [city, country]"
      );
    };

    const mapAdd = async (message: Message) => {
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

      const countries = message.member.roles.cache
        .filter((role) => CountryRoleFinder.isCountryRole(role.name))
        .map((role) => CountryRoleFinder.getCountryByRole(role.name));

      const maintainerDm = await message.guild.members
        .resolve(process.env.MAP_ADD_DM_USER_ID)
        .user.createDM();
      const author = message.member;
      const infoString = `Someone new wants to be added to the map!
      UserID: ${message.author.id}
      Current name on the server: ${author.displayName}
      Current Discord tag: ${author.user.tag}
      City/Location: ${city}
      Countries: ${countries.join(", ")}
      Link to the message calling the command: ${message.url}`;
      await maintainerDm.send(infoString);
      await message.reply(
        "I messaged the maintainer of the map, they will add you to it soon!"
      );
    };
  }
}
