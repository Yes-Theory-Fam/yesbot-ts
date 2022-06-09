import { Message, TextChannel } from "discord.js";
import { VoiceOnDemand } from "../programs";

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
    case "bot-commands":
      if (firstWord === "!voice") await VoiceOnDemand(message);
      break;
  }
};

export default message;
