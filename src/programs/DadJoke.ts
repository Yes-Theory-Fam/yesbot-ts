import Discord, { TextChannel } from "discord.js";
import { DeadchatQuestion, DeadchatRepository } from "../entities/Deadchat";
import Axios from "axios";

export default async function DadJoke(pMessage: Discord.Message) {
  const dadJoke = await Axios.get("https://icanhazdadjoke.com/", {
    headers: {
      Accept: "text/plain",
    },
  });

  console.log("DadJoke: ", dadJoke);

  if (dadJoke.status === 200) {
    pMessage.channel.send(`:dadbot_yf: ${dadJoke.data}`);
    return;
  }
}
