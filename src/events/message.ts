import { Message, TextChannel } from "discord.js";
import { ExportManager, MapTools, VoiceOnDemand } from "../programs";

const message = async (msg: Message) => {
  if (msg.channel.type === "DM" && !msg.author.bot) {
    return;
  } else {
    await routeMessage(msg);
  }
};

const routeMessage = async (message: Message) => {
  const words = message.content.toLowerCase().split(/\s+/);
  const channel = <TextChannel>message.channel;
  const firstWord = words[0];

  switch (channel.name) {
    case "permanent-testing":
      if (firstWord === "!export") await ExportManager(message);
    case "bot-commands":
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
};

export default message;
