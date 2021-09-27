import { Message, TextChannel } from "discord.js";
import {
  ExportManager,
  GroupManager,
  MapTools,
  VoiceOnDemand,
} from "../programs";

const message = async (msg: Message) => {
  if (msg.channel.type === "DM" && !msg.author.bot) {
    return;
  } else {
    await routeMessage(msg);
  }
};

const routeMessage = async (message: Message) => {
  const words = message.content.split(/\s+/);
  const channel = <TextChannel>message.channel;
  const firstWord = words[0];
  const restOfMessage = words.slice(1).join(" ");

  switch (channel.name) {
    case "permanent-testing":
      if (firstWord === "!export") await ExportManager(message);
      if (
        firstWord === "!group" &&
        !message.content.toLowerCase().startsWith("!group toggle")
      )
        await GroupManager(message, true);
    case "bot-commands":
      if (
        firstWord === "!group" &&
        !message.content.toLowerCase().startsWith("!group toggle")
      )
        await GroupManager(message, true);

      if (firstWord === "!voice") await VoiceOnDemand(message);
      if (firstWord === "!map") await MapTools.map(message);
      if (firstWord === "!mapadd") await MapTools.mapAdd(message);
      break;
  }

  if (firstWord === "!goodbye") {
    const guildRole = message.guild.roles.cache.find(
      (r) => r.name.toLowerCase() === "head"
    );
    await message.member.roles.remove(guildRole);
  }

  if (message.content.toLowerCase().startsWith("!group toggle"))
    await GroupManager(message, true);

  if (words.includes("@group")) await GroupManager(message, false);
};

export default message;
