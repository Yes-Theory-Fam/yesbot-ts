import { Message } from "discord.js";
import Tools from "../common/tools";

export const map = (message: Message) => {
  message.reply(
    "you can find the map here: " +
      process.env.MAP_LINK +
      "\nIf you want to be added to it, type !mapadd [city, country]"
  );
};

export const mapAdd = async (message: Message) => {
  const split = message.content.split(" ");
  split.shift();
  const city = split.join(" ");
  if (!city) {
    Tools.handleUserError(message, "You need to add the city you are from!");
    return;
  }

  const prefix = "I'm from ";
  const countries = message.member.roles.cache
    .filter((r) => r.name.startsWith(prefix))
    .map((r) => r.name.substring(prefix.length, r.name.length - 1));

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
  message.reply(
    "I messaged the maintainer of the map, they will add you to it soon!"
  );
};
