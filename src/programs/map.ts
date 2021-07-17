import { Message } from "discord.js";
import Tools from "../common/tools";
import { CountryRoleFinder } from "../utils/country-role-finder";

export const map = async (message: Message) => {
  await message.reply(
    "you can find the map here: " +
      process.env.MAP_LINK +
      "\nIf you want to be added to it, type !mapadd [city, country]"
  );
};

export const mapAdd = async (message: Message) => {
  await message.reply(
    "Hey, unfortunately this command is disabled at the moment as the bot currently isn't allowed to send DMs. This is being worked on :) Make sure to check #updates regularly to see when it's working again. Sorry about the inconveniences!"
  );
  return;

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
