import {
  CollectorFilter,
  GuildMember,
  Message,
  MessageEmbed,
  MessageMentionOptions,
  MessageReaction,
  User,
} from "discord.js";
import { utcToZonedTime, zonedTimeToUtc } from "date-fns-tz";
import { getAllCountries, getCountry } from "countries-and-timezones";

import Tools from "../common/tools";
import { isAuthorModerator, textLog } from "../common/moderator";
import { createYesBotLogger } from "../log";
import prisma from "../prisma";
import { Birthday } from "@yes-theory-fam/database/client";
import { CountryRoleFinder } from "../utils/country-role-finder";
import { Command, CommandHandler, DiscordEvent } from "../event-distribution";

const logger = createYesBotLogger("programs", "BirthdayManager");

const months = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
];

@Command({
  event: DiscordEvent.MESSAGE,
  trigger: "!birthday",
  channelNames: ["bot-commands"],
  description:
    "This handler is to give the ability of a member server to save his birthday to the DB",
})
class BirthdayManager implements CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message): Promise<void> {
    const words = Tools.stringToWords(message.content);

    if (words.length < 2) {
      await Tools.handleUserError(
        message,
        "Please type !birthday and your birthday. I prefer if you use a name for the month :robot:"
      );
      return;
    }

    const birthdayUser =
      isAuthorModerator(message) && message.mentions.users.size === 1
        ? message.mentions.users.first()
        : message.author;

    const userExistingBirthday = await getUserBirthday(birthdayUser.id);

    if (userExistingBirthday !== null) {
      await Tools.handleUserError(
        message,
        `I have already stored your birthday as ${formatBirthday(
          userExistingBirthday
        )} :tada:`
      );
      return;
    }

    const birthdate = getUserBirthdate(message.content);

    if (birthdate === null) {
      await Tools.handleUserError(
        message,
        "I'm unable to understand that date. Could you please specify it in month-date form? Like this: `!birthday december-24`. Thank you!"
      );
      return;
    }

    const birthdayMessage = await message.channel.send(
      `Hi <@${birthdayUser.id}>, I think your birthday is ${formatBirthday(
        birthdate
      )}. If that is correct, please click :+1:.`
    );
    await birthdayMessage.react("👍");
    await birthdayMessage.react("👎");

    const filter: CollectorFilter<[MessageReaction, User]> = (reaction, user) => {
      return (
        (user.id === birthdayUser.id || user.id === message.author.id) &&
        ["👍", "👎"].includes(reaction.emoji.name)
      );
    };

    let birthdayAccepted;
    try {
      birthdayAccepted = await birthdayMessage.awaitReactions({
        filter,
        max: 1,
        time: 15000,
        errors: ["time"],
      });
    } catch (err) {
      // timeout probably
      return;
    }

    if (birthdayAccepted.first().emoji.name === "👎") {
      await message.channel.send(
        "Okay, please be more specific and try again, or hang around for a Support to help you out! :grin:"
      );
      return;
    }

    // Clean up
    await birthdayMessage.delete();

    let timezone;
    try {
      timezone = await getUserTimezone(message);
    } catch (err) {
      if (
        err instanceof Error &&
        err.message === "Too many available time zones"
      ) {
        const engineerRole = Tools.getRoleByName(
          process.env.ENGINEER_ROLE_NAME,
          message.guild
        );
        await message.delete();
        const allowedMentions: MessageMentionOptions = {
          roles: [engineerRole.id],
          users: [message.author.id],
        };
        await message.reply({
          content:
          "Ouch, it seems like you have an extreme amounts of timezones available!" +
          "\nPlease wait while I call for my masters. :grin:" +
          `\nBeep boop ${engineerRole.toString()}? :telephone:`,
        allowedMentions,
        });
      } else if (err instanceof Error && err.message === "time expired") {
        await message.react("⏰");
      } else {
        logger.error(
          "An unknown error has occurred awaiting the users timezone: ",
          { err }
        );
        await message.channel.send(
          "Hmm, something went wrong. Please contact my engineers if this seems unreasonable. :nerd:"
        );
      }
      return;
    }

    await message.channel.send(
      `Okay, I'll store your birthday as ${formatBirthday(
        birthdate
      )} in the timezone ${timezone}.`
    );
    await textLog(
      "Hi there! Could someone help me by executing this command? Thank you!"
    );
    await textLog(
      `\`bb.override <@${birthdayUser.id}> set ${formatBirthday(
        birthdate
      )} ${timezone}\``
    );

    const birthday = createBirthday(birthdayUser.id, birthdate, timezone);
    await prisma.birthday.create({ data: birthday });
  }
}

export function createBirthday(
  id: string,
  birthdate: Date,
  timezone: string
): Birthday {
  return {
    userId: id,
    birthdate: zonedTimeToUtc(birthdate, timezone),
    timezone,
  };
}

export function getUserBirthdate(message: string): Date | null {
  const words = message.split(/[\s,-\/.]\s?/);

  const monthNameMatches = months.find((month) =>
    words.find((word) => word.toLowerCase().includes(month))
  );

  let monthNumMatch = -1;
  if (monthNameMatches === undefined) {
    // This will brute force by taking the first word that's a pure number..
    const matches = words.filter((word) => {
      if (word.length > 2) {
        return false;
      }
      const n = parseInt(word);
      if (isNaN(n)) {
        return false;
      }
      return n > 0 && n <= 12;
    });

    if (matches.length > 1 && matches[0] !== matches[1]) {
      // Maybe a bit harsh, but we abort early if we find >= 2 numbers in the message
      // where both of them are numbers <= 12 but not the same.
      return null;
    }
    monthNumMatch = parseInt(matches[0]);
  }

  let messageWithoutMonthNumber = message;
  if (monthNameMatches === undefined) {
    const pre = message.substr(0, message.indexOf(monthNumMatch.toString()));
    const post = message.substr(pre.length + monthNumMatch.toString().length);
    messageWithoutMonthNumber = pre + post;
  }

  const dayMatches = messageWithoutMonthNumber.match(
    /(0[1-9]|[1-3]0|[1-9]+)(st|nd|rd|th)?/
  );

  if (!dayMatches || dayMatches.length < 2) {
    logger.error(`Couldn't find a match for a day in ${message}`);
    return null;
  }

  // First one is the JS direct match, 2nd one is first capture group (\d+), which is the actual date
  const day = parseInt(dayMatches[1]);

  if (isNaN(day)) {
    logger.error(`Failed to parse ${dayMatches[1]} as an int`);
    return null;
  }

  const month =
    monthNameMatches !== undefined
      ? months.indexOf(monthNameMatches)
      : monthNumMatch - 1;

  if (
    monthNameMatches === undefined &&
    monthNumMatch !== day &&
    monthNumMatch <= 12 &&
    day <= 12
  ) {
    // Cannot find out since i don't know which is month and which is date
    return null;
  }

  return new Date(1972, month, day);
}

async function getUserTimezone(message: Message): Promise<string> {
  const countryRole = await fetchUserCountryRoles(message.member);

  const timezones = countryRole
    .map(timezonesFromRole)
    .reduce((prev, curr) => [...prev, ...curr], [])
    .filter((tz) => tz.includes("/"));

  if (timezones.length > 20) {
    logger.error("User has too many available timezones: ", timezones);
    throw new Error("Too many available time zones");
  }

  const response = new MessageEmbed();
  response.setTitle("Pick your timezone");

  const regionIdentifierStart = 127462;
  const reactions: string[] = timezones.map((tz, i) => {
    const currentTime = new Date();
    const currentTimeString = `Current time: ${currentTime.toLocaleTimeString(
      "en-GB",
      { timeZone: tz }
    )}`;
    const identifier = String.fromCodePoint(regionIdentifierStart + i);
    response.addField(tz, `${identifier} - ${currentTimeString}`);
    return identifier;
  });

  const sentMessage = await message.channel.send({ embeds: [response] });
  for (const reaction of reactions) {
    try {
      await sentMessage.react(reaction);
    } catch (err) {
      logger.error("Error while adding timezones", err);
      // If we err here, it's probably because the user already selected an emoji.
      // Best to just skip adding more emojis.
      break;
    }
  }

  const filter: CollectorFilter<[MessageReaction, User]> = (reaction, user) => {
    return (
      user.id === message.author.id && reactions.includes(reaction.emoji.name)
    );
  };

  let received;
  try {
    received = await sentMessage.awaitReactions({
      filter,
      max: 1,
      time: 60000,
      errors: ["time"],
    });
  } catch (err) {
    if (err.toString() === "[object Map]") {
      await sentMessage.delete();
      throw new Error("time expired");
    } else {
      throw err;
    }
  }

  const reaction = received.first();
  const selectedTz = timezones[reactions.indexOf(reaction.emoji.name)];

  await sentMessage.delete();
  return selectedTz;
}

interface CountryWithRegion {
  country: string;
  region: string;
}

async function fetchUserCountryRoles(
  user: GuildMember
): Promise<CountryWithRegion[]> {
  return user.roles.cache
    .filter((role) => CountryRoleFinder.isCountryRole(role.name, true))
    .map<CountryWithRegion>((role) => ({
      country: CountryRoleFinder.getCountryByRole(role.name, true),
      region: role.name.substring(
        role.name.indexOf("(") + 1,
        role.name.indexOf(")")
      ),
    }));
}

function timezonesFromRole(props: CountryWithRegion): readonly string[] {
  const { country, region } = props;
  // Edge cases
  switch (country) {
    case "USA":
      switch (region) {
        case "Southwest": {
          return ["America/Shiprock", "America/Phoenix"];
        }
        case "West": {
          return [
            "America/Atka",
            "America/Adak",
            "America/Anchorage",
            "America/Boise",
            "America/Denver",
            "America/Juneau",
            "America/Los_Angeles",
            "America/Metlakatla",
            "America/Nome",
            "America/Sitka",
            "America/Yakutat",
          ];
        }
        case "Midwest": {
          return [
            "America/Indianapolis",
            "America/Chicago",
            "America/Detroit",
            "America/Fort_Wayne",
            "America/Menominee",
          ];
        }
        case "Southeast": {
          return ["America/Louisville"];
        }
        case "Northeast": {
          return ["America/New_York"];
        }
        default: {
          // This is to slim down the extremely big list of US TZs.
          // Also, we remove any timezone that JS is unable to display.
          const usTZs = getCountry("US")
            .timezones.filter((tz) => tz.startsWith("America/"))
            .filter((tz) => tz.lastIndexOf("/") === tz.indexOf("/"));
          return usTZs
            .map((tz) => {
              try {
                new Date().toLocaleTimeString("en-GB", { timeZone: tz });
                return tz;
              } catch (e) {
                return null;
              }
            })
            .filter((tz) => tz !== null);
        }
      }
    case "UK":
      return getCountry("GB").timezones;
    case "Mexico":
      return getCountry("MX")
        .timezones // BajaSur and BajaNorth are invalid in JS.
        .filter((tz) => !tz.startsWith("Mexico/Baja"));
    case "Australia": {
      return [
        "Australia/Perth",
        "Australia/Darwin",
        "Australia/Adelaide",
        "Australia/Brisbane",
        "Australia/Sydney",
      ];
    }
    case "Canada": {
      return getCountry("CA").timezones.filter((tz) =>
        tz.startsWith("Canada/")
      );
    }
    case "Czech Republic": {
      return getCountry("CZ").timezones;
    }
    case "Brazil": {
      return [
        "Brazil/Acre",
        "Brazil/East",
        "Brazil/West",
        "America/Rio_Branco",
        "America/Sao_Paulo",
      ];
    }
    case "Argentina": {
      return ["America/Buenos_Aires"];
    }
    case "Chile": {
      return ["America/Santiago"];
    }
    case "UAE": {
      return getCountry("AE").timezones;
    }
    case "Russia": {
      return [
        "Europe/Kaliningrad",
        "Europe/Moscow",
        "Europe/Samara",
        "Asia/Yekaterinburg",
        "Asia/Omsk",
        "Asia/Novosibirsk",
        "Asia/Irkutsk",
        "Asia/Yakutsk",
        "Asia/Vladivostok",
        "Asia/Magadan",
        "Asia/Kamchatka",
      ];
    }
  }

  // let's find what tz's are available for this country
  let fixedCountry = country;
  if (country.startsWith("the "))
    fixedCountry = country.substring("the ".length);

  // REALLY
  const countries = getAllCountries();
  const correctCountry = Object.values(countries).find(
    (country) => country.name === fixedCountry
  );

  return correctCountry?.timezones ?? [];
}

export async function getUserBirthday(userId: string): Promise<Date | null> {
  const userExistingBirthday = await prisma.birthday.findUnique({
    where: { userId },
  });

  return userExistingBirthday
    ? utcToZonedTime(
        userExistingBirthday.birthdate,
        userExistingBirthday.timezone
      )
    : null;
}

export function formatBirthday(date: Date | null): string {
  return date === null
    ? "Unknown"
    : `${months[date.getMonth()]}-${date.getDate()}`;
}
