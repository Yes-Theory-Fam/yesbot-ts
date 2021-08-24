import { config } from "dotenv";
import { Client, Snowflake } from "discord.js";
import { writeFile } from "fs/promises";
import { CountryRoleFinder } from "../utils/country-role-finder";

config();

const exportFileName = "region-members-export.json";

const client = new Client({ intents: [] });
client.login(process.env.BOT_TOKEN).then(() => console.log("Logged in"));

const main = async () => {
  const guild = client.guilds.resolve(process.env.GUILD_ID);
  if (!guild) {
    throw new Error("Couldn't find specified guild.");
  }

  const regionRoles = guild.roles.cache
    .filter(({ name }) => CountryRoleFinder.isCountryRole(name))
    .values();

  const regionToMemberMatch: Record<string, Snowflake[]> = {};

  for (const { name, members } of regionRoles) {
    regionToMemberMatch[name] = members.map(({ id }) => id);
  }

  const exportString = JSON.stringify(regionToMemberMatch, null, 4);
  await writeFile(exportFileName, exportString, "utf-8");

  console.log("Done, closing client in 3 seconds");

  setTimeout(() => client.destroy(), 3000);
};

client.on("ready", main);
