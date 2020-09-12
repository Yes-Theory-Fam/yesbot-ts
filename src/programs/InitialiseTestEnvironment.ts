import { Client } from "discord.js";

export default async function InitialiseTestEnvironment(bot: Client) {
  const testGuild = bot.guilds.cache.find((g) => g.name == "Test Theory Fam");
  testGuild.channels.create("Role-picker");
}
