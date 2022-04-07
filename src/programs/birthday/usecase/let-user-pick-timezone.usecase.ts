import { getAllCountries, getCountry } from "countries-and-timezones";
import {
  CollectorFilter,
  GuildMember,
  Message,
  MessageEmbed,
  MessageReaction,
  User,
} from "discord.js";
import { createYesBotLogger } from "../../../log";
import { CountryRoleFinder } from "../../../utils/country-role-finder";

interface CountryWithRegion {
  country: string;
  region: string;
}

export class LetUserPickTimezoneUsecase {
  private readonly logger = createYesBotLogger(
    "birthday",
    LetUserPickTimezoneUsecase.name
  );

  async getUserTimezone(message: Message): Promise<string> {
    const countryRole = await this.fetchUserCountryRoles(message.member);

    const timezones = countryRole
      .map(this.timezonesFromRole)
      .reduce((prev, curr) => [...prev, ...curr], [])
      .filter((tz) => tz.includes("/"));

    if (timezones.length === 0) {
      throw new Error("No timezone found");
    }

    if (timezones.length > 20) {
      this.logger.error("User has too many available timezones: ", timezones);
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
        this.logger.error("Error while adding timezones", err);
        // If we err here, it's probably because the user already selected an emoji.
        // Best to just skip adding more emojis.
        break;
      }
    }

    const filter: CollectorFilter<[MessageReaction, User]> = (
      reaction,
      user
    ) => {
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

  private async fetchUserCountryRoles(
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

  private timezonesFromRole(props: CountryWithRegion): readonly string[] {
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
}
