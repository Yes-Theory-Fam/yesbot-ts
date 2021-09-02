import { countries, Country } from "../collections/flagEmojis";
import { Guild, Role } from "discord.js";

type FinderCountryProperties = Pick<Country, "name" | "emoji">;

export class CountryRoleFinder {
  private static emojiOverrides: Record<string, string> = {
    "🇦🇽": "🇫🇮",
    "🇧🇻": "🇳🇴",
    "🇸🇯": "🇳🇴",
    "🇬🇮": "🇬🇧",
    "🇺🇲": "🇺🇸",
    "🇨🇵": "🇫🇷",
    "🇲🇫": "🇫🇷",
    "🇪🇦": "🇪🇸",
    "🇮🇴": "🇬🇧",
    "🇭🇲": "🇦🇺",
    "🇮🇲": "🇬🇧",
  };

  private static emojiToCountryOverrides: Record<string, Country> =
    CountryRoleFinder.generateEmojiToCountryOverrides();

  private static generateEmojiToCountryOverrides(): Record<string, Country> {
    const result: Record<string, Country> = {};

    for (const key in CountryRoleFinder.emojiOverrides) {
      const value = CountryRoleFinder.emojiOverrides[key];
      result[key] = countries.find((c) => c.emoji == value);
    }

    return result;
  }

  static getCountriesFromString = (input: string) => {
    const flagEmojiRegex = /[\u{1f1e6}-\u{1f1ff}]{2}/gmu;
    const flagsInInput = input.match(flagEmojiRegex) ?? [];

    const matchedCountries = countries
      .filter((country: Country) => {
        const isEmojiInInput = country.emoji.match(flagEmojiRegex)
          ? flagsInInput.includes(country.emoji)
          : input.includes(country.emoji);

        return (
          isEmojiInInput || input.match(RegExp(`\\b${country.name}\\b`, "i"))
        );
      })
      .map((c) => CountryRoleFinder.emojiToCountryOverrides[c.emoji] ?? c);
    return matchedCountries.filter(
      ({ name: filterName }, index, self) =>
        self.findIndex(({ name }) => name === filterName) === index
    );
  };

  static getRoleForCountry(country: Country, guild: Guild): Role {
    return guild.roles.cache.find((role) =>
      CountryRoleFinder.isRoleFromCountry(country, role)
    );
  }

  static getCountryByRole(input: string, allowRegions = false): string | null {
    const result = this.getMatches(input, allowRegions);
    return result?.name;
  }

  static isCountryRole(input: string, allowRegions = false): boolean {
    const result = this.getMatches(input, allowRegions);
    return !!result;
  }

  static isRoleFromCountry(country: Country, role: Role): boolean {
    if (
      country.name === "England" ||
      country.name === "Scotland" ||
      country.name === "Wales"
    ) {
      return this.check({ name: "UK", emoji: "🇬🇧" }, role.name, false, true);
    }

    return this.check(country, role.name, false, true);
  }

  private static getMatches(input: string, allowRegions = false): Country {
    const match = countries.find((country) =>
      this.check(country, input, allowRegions)
    );

    return CountryRoleFinder.emojiToCountryOverrides[match?.emoji] ?? match;
  }

  private static check(
    country: FinderCountryProperties,
    compare: string,
    allowRegions = false,
    useOverrides = false
  ) {
    if (!allowRegions && compare.match(/\(.*\)/)) return false;

    const comparator = (a: string, b: string) =>
      allowRegions ? a.startsWith(b) : a === b;

    const emoji = useOverrides
      ? this.emojiOverrides[country.emoji] ?? country.emoji
      : country.emoji;

    return (
      compare.includes(emoji) ||
      comparator(compare, `I'm from ${country.name}!`) ||
      comparator(compare, `I'm from the ${country.name}!`)
    );
  }
}
