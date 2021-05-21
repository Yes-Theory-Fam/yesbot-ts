import {
  getCountriesFromMessage,
  getRoleForCountry,
} from "./WhereAreYouFromManager";
import bot from "../index";

// message, countryName, roleName
type Testcase = [string, string, string];

const cases: Array<Testcase> = [
  ["🇴🇲", "Oman", "I'm from Oman!"],
  ["Oman", "Oman", "I'm from Oman!"],
  ["🇷🇴", "Romania", "I'm from Romania!"],
  ["romania", "Romania", "I'm from Romania!"],
  ["norway", "Norway", "I'm from Norway!"],
  ["🇺🇲", "USA", "I'm from the USA!"],
  ["🇦🇪", "UAE", "I'm from the UAE!"],
  ["England", "England", "I'm from the UK! (England)"],
  ["Scotland", "Scotland", "I'm from the UK! (Scotland)"],
];

const test = () => {
  const errors = cases
    .map(([message, countryName, roleName]) => {
      const countries = getCountriesFromMessage(message);
      if (countries.length === 0) {
        return `Got no countries, expected ${countryName} for message ${message}`;
      }

      if (countries.length > 1) {
        return `Got ${countries}, expected ${countryName} for message ${message}`;
      }

      const country = countries[0];

      if (country.name !== countryName) {
        return `Got country ${country.name}, expected ${countryName} for message ${message}`;
      }

      const guild = bot.guilds.resolve(process.env.GUILD_ID);
      const role = getRoleForCountry(country, guild);

      if (!role) {
        return `Couldn't find role ${roleName} for country ${country.name}`;
      }

      if (role.name !== roleName) {
        return `Got role ${role.name}, expected ${roleName} for country ${country.name}`;
      }

      return "";
    })
    .filter((m) => m.length > 0);

  if (errors.length > 1) {
    console.log(`${errors.length} Errors`);
    errors.forEach((e) => console.log(e));
  }

  console.log("Done!");

  //Delay to allow the bot to clear the event queue before terminating to avoid an error that otherwise occurs
  setTimeout(() => bot.destroy(), 1000);
};

// bot.on("ready", () => bot.destroy());
bot.on("ready", test);
