import Discord from "discord.js";

export default async function PollsManager(pMessage: Discord.Message) {
  await pMessage.react("🇦");
  await pMessage.react("🅱️");
  //Playground below
}
