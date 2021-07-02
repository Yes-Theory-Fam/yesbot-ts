import { countries, Country } from "../collections/flagEmojis";
import { Role } from "discord.js";

type FinderCountryProperties = Pick<Country, "name" | "emoji">;

export class CountryRoleFinder {
  private static emojiOverrides: Record<string, string> = {
    "🇺🇲": "🇺🇸",
    "🇨🇵": "🇫🇷",
    "🇲🇫": "🇫🇷",
    "🇪🇦": "🇪🇸",
    "🇮🇴": "🇬🇧",
  };

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
      return this.check({ name: "UK", emoji: "🇬🇧" }, role.name);
    }

    return this.check(country, role.name);
  }

  private static getMatches(input: string, allowRegions = false): Country {
    return countries.find((country) =>
      this.check(country, input, allowRegions)
    );
  }

  private static check(
    country: FinderCountryProperties,
    compare: string,
    allowRegions = false
  ) {
    if (!allowRegions && compare.match(/\(.*\)/)) return false;

    const emoji = this.emojiOverrides[country.emoji] ?? country.emoji;

    const comparator = (a: string, b: string) =>
      allowRegions ? a.startsWith(b) : a === b;

    return (
      compare.includes(emoji) ||
      comparator(compare, `I'm from ${country.name}!`) ||
      comparator(compare, `I'm from the ${country.name}!`)
    );
  }
}
