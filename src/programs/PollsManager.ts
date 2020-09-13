import { Message } from "discord.js";

export default async function PollsManager(pMessage: Message) {
  await pMessage.react("🇦");
  await pMessage.react("🅱️");
}
