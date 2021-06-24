import { countries, Country } from "../collections/flagEmojis";
import { Role } from "discord.js";

type FinderCountryProperties = Pick<Country, "name" | "emoji">;

export class CountryRoleFinder {
  static getCountryByRole(input: string): string {
    const result = this.getMatches(input);
    return result.name;
  }

  static isCountryRole(input: string): boolean {
    const result = this.getMatches(input);
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

  private static getMatches(input: string): Country {
    return countries.find((country) => this.check(country, input));
  }

  private static check(country: FinderCountryProperties, compare: string) {
    return (
      compare.includes(country.emoji) || compare === `I'm from ${country.name}!`
    );
  }
}
