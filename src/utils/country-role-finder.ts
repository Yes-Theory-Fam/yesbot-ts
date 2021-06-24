import { countries, Country } from "../collections/flagEmojis";
import { Role } from "discord.js";

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
      return (
        role.name === `I'm from UK` ||
        role.name === `I'm from UK!` ||
        role.name === `I'm from UK! 🇬🇧` ||
        role.name === `UK 🇬🇧`
      );
    }
    return (
      role.name === `I'm from ${country.name}` ||
      role.name === `I'm from ${country.name}!` ||
      role.name === `I'm from ${country.name}! ${country.emoji}` ||
      role.name === `${country.name} ${country.emoji}`
    );
  }

  private static getMatches(input: string): Country {
    return countries.find((country) => {
      return (
        input === `I'm from ${country.name}` ||
        input === `I'm from ${country.name}!` ||
        input === `I'm from ${country.name}! ${country.emoji}` ||
        input === `${country.name} ${country.emoji}`
      );
    });
  }
}
