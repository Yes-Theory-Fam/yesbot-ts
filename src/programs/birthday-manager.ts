import { Birthday } from "@prisma/client";
import {
  getAllCountries,
  getCountry,
  TimezoneName,
} from "countries-and-timezones";
import { utcToZonedTime, zonedTimeToUtc } from "date-fns-tz";
import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  ComponentType,
  GuildMemberRoleManager,
  SelectMenuBuilder,
  SelectMenuInteraction,
} from "discord.js";
import { CountryRoleFinder } from "../common/country-role-finder";
import { textLog } from "../common/moderator";

import { Command, CommandHandler, DiscordEvent } from "../event-distribution";
import { createYesBotLogger } from "../log";
import prisma from "../prisma";

const logger = createYesBotLogger("programs", "BirthdayManager");

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const monthChoices = months.map((name, index) => ({ name, value: index }));

@Command({
  event: DiscordEvent.SLASH_COMMAND,
  root: "birthday",
  subCommand: "add",
  description: "Add your birthday to YesBot!",
  options: [
    {
      name: "day",
      type: ApplicationCommandOptionType.Integer,
      min_value: 1,
      max_value: 31,
      description: "The day of your birthday",
      required: true,
    },
    {
      name: "month",
      type: ApplicationCommandOptionType.Integer,
      choices: monthChoices,
      description: "The month of your birthday",
      required: true,
    },
  ],
})
class BirthdayManager implements CommandHandler<DiscordEvent.SLASH_COMMAND> {
  async handle(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild) return;

    const day = interaction.options.getInteger("day")!;
    const month = interaction.options.getInteger("month")!;

    const userExistingBirthday = await getUserBirthday(interaction.user.id);

    if (userExistingBirthday !== null) {
      await interaction.reply(
        `I have already stored your birthday as ${formatBirthday(
          userExistingBirthday
        )} :tada:`
      );
      return;
    }

    let timezone;
    try {
      timezone = await getUserTimezone(interaction);
    } catch (err) {
      await interaction.reply(
        "Hmm, something went wrong. Please contact my engineers if this seems unreasonable. :nerd:"
      );
      return;
    }

    const birthdate = new Date(1972, month, day);

    const userId = interaction.user.id;
    await interaction.reply(
      `Okay, I'll store your birthday as ${formatBirthday(
        birthdate
      )} in the timezone ${timezone}.`
    );
    await textLog(
      "Hi there! Could someone help me by executing this command? Thank you!"
    );
    await textLog(
      `\`/override set-birthday target:${userId} date:${formatBirthday(
        birthdate
      )}\`
\`/override set-timezone target:${userId} zone:${timezone}\``
    );

    const birthday = createBirthday(userId, birthdate, timezone);
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

async function getUserTimezone(
  interaction: ChatInputCommandInteraction
): Promise<string> {
  if (!interaction.member) {
    throw new Error("Trying to find timezone for user outside of guild");
  }

  const countryRole = await fetchUserCountryRoles(interaction.member.roles);

  const timezones = countryRole
    .map(timezonesFromRole)
    .reduce((prev, curr) => [...prev, ...curr], [])
    .filter((tz) => tz.includes("/"));

  if (timezones.length === 0) {
    throw new Error("No timezone found");
  }

  if (timezones.length > 20) {
    logger.error("User has too many available timezones: ", timezones);
    throw new Error("Too many available time zones");
  }

  const timezoneSelectId = "birthday-timezone-select";
  const options = timezones.map((tz) => {
    const currentTime = new Date();
    const currentTimeString = `Current time: ${currentTime.toLocaleTimeString(
      "en-GB",
      { timeZone: tz }
    )}`;

    return { value: tz, label: tz, description: currentTimeString };
  });
  const textSelect = new SelectMenuBuilder({
    placeholder: "Pick your timezone",
    customId: timezoneSelectId,
    options,
  });

  const components = new ActionRowBuilder<SelectMenuBuilder>({
    components: [textSelect],
  });
  const response = await interaction.reply({
    content: "Pick your timezone:",
    components: [components],
  });

  const filter = (selectInteraction: SelectMenuInteraction) =>
    selectInteraction.customId === timezoneSelectId &&
    selectInteraction.user.id === interaction.user.id;
  const selection = await response.awaitMessageComponent({
    componentType: ComponentType.SelectMenu,
    time: 60_000,
    filter,
  });

  await selection.update({ content: "Alright, let's see" });

  return selection.values[0];
}

interface CountryWithRegion {
  country: string;
  region: string;
}

async function fetchUserCountryRoles(
  roles: string[] | GuildMemberRoleManager
): Promise<CountryWithRegion[]> {
  const roleNames = Array.isArray(roles)
    ? roles
    : [...roles.cache.map((r) => r.name).values()];

  return roleNames
    .filter((roleName) => CountryRoleFinder.isCountryRole(roleName, true))
    .map<CountryWithRegion>((roleName) => ({
      // Cast is valid here because the filter above already ensures we get strings back
      country: CountryRoleFinder.getCountryByRole(roleName, true) as string,
      region: roleName.substring(
        roleName.indexOf("(") + 1,
        roleName.indexOf(")")
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
            .filter((tz): tz is TimezoneName => tz !== null);
        }
      }
    case "UK":
      return getCountry("GB").timezones;
    case "Mexico":
      return getCountry("MX").timezones;
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
      return getCountry("CA", { deprecated: true }).timezones.filter((tz) =>
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
    ? userExistingBirthday.timezone
      ? utcToZonedTime(
          userExistingBirthday.birthdate,
          userExistingBirthday.timezone
        )
      : userExistingBirthday.birthdate
    : null;
}

export function formatBirthday(date: Date | null): string {
  return !date ? "Unknown" : `${months[date.getMonth()]}-${date.getDate()}`;
}
