import { CountryRoleFinder } from "../../src/utils/country-role-finder";
import MockDiscord from "../mocks";
import { Collection, Role, RoleManager } from "discord.js";
import { countries } from "../../src/collections/flagEmojis";

describe("CountryRoleFinder", () => {
  it("should find as country-role", () => {
    expect(CountryRoleFinder.isCountryRole("Germany 🇩🇪")).toBeTruthy();
    expect(CountryRoleFinder.isCountryRole("I'm from Germany!")).toBeTruthy();
    expect(
      CountryRoleFinder.isCountryRole("I'm from Germany! 🇩🇪")
    ).toBeTruthy();
    expect(
      CountryRoleFinder.isCountryRole("I'm from Åland Islands! 🇦🇽")
    ).toBeTruthy();

    expect(CountryRoleFinder.isCountryRole("I'm from the USA!")).toBeTruthy();
    expect(
      CountryRoleFinder.isCountryRole("I'm from the USA! (West)", true)
    ).toBeTruthy();
    expect(CountryRoleFinder.isCountryRole("USA (West) 🇺🇸", true)).toBeTruthy();
    expect(
      CountryRoleFinder.isCountryRole(
        "I'm from Heard Island and McDonald Islands 🇭🇲"
      )
    ).toBeTruthy();
  });

  it("should not find as country-role", () => {
    expect(CountryRoleFinder.isCountryRole("Germany")).toBeFalsy();
    expect(CountryRoleFinder.isCountryRole("Germany :flag_de")).toBeFalsy();
    expect(CountryRoleFinder.isCountryRole("Germany :flag_DE")).toBeFalsy();
    expect(CountryRoleFinder.isCountryRole("Award Winner :eyes:")).toBeFalsy();
    expect(CountryRoleFinder.isCountryRole("Award Winner 🏅")).toBeFalsy();
    expect(CountryRoleFinder.isCountryRole("USA (Northeast) 🇺🇸")).toBeFalsy();
  });

  it("should return the country-name", () => {
    expect(CountryRoleFinder.getCountryByRole("Germany 🇩🇪")).toMatch("Germany");
    expect(CountryRoleFinder.getCountryByRole("I'm from Germany!")).toMatch(
      "Germany"
    );
    expect(CountryRoleFinder.getCountryByRole("I'm from Germany! 🇩🇪")).toMatch(
      "Germany"
    );

    // Works with overrides
    expect(CountryRoleFinder.getCountryByRole("Åland Islands 🇦🇽")).toMatch(
      "Finland"
    );
    expect(CountryRoleFinder.getCountryByRole("🇮🇲")).toMatch("UK");
  });

  it("should match the role for UK based country", () => {
    const mockDiscord = new MockDiscord();
    const role = mockDiscord.getRole();
    const country = {
      code: "WA",
      emoji: "🏴󠁧󠁢󠁷󠁬󠁳󠁿",
      unicode: "U+1F3F4󠁧+U+E0067󠁢+U+E0062󠁷+U+E0077󠁬+U+E006C󠁳+U+E0073󠁿+U+E007F",
      name: "Wales",
      title: "flag for Wales",
    };
    role.name = "UK 🇬🇧";
    expect(CountryRoleFinder.isRoleFromCountry(country, role)).toBeTruthy();
  });

  it("should match the role", () => {
    const mockDiscord = new MockDiscord();
    const role = mockDiscord.getRole();
    const country = {
      code: "DE",
      emoji: "🇩🇪",
      unicode: "U+1F1E9 U+1F1EA",
      name: "Germany",
      title: "flag for Germany",
    };
    role.name = "Germany 🇩🇪";
    expect(CountryRoleFinder.isRoleFromCountry(country, role)).toBeTruthy();
  });

  it("should match the role even if it includes other terms", () => {
    const mockDiscord = new MockDiscord();
    const role = mockDiscord.getRole();
    const country = {
      code: "WA",
      emoji: "🏴󠁧󠁢󠁷󠁬󠁳󠁿",
      unicode: "U+1F3F4󠁧+U+E0067󠁢+U+E0062󠁷+U+E0077󠁬+U+E006C󠁳+U+E0073󠁿+U+E007F",
      name: "Wales",
      title: "flag for Wales",
    };
    role.name = "the UK 🇬🇧";
    expect(CountryRoleFinder.isRoleFromCountry(country, role)).toBeTruthy();
  });

  it("should work with flag emojis that have manual overrides", () => {
    const mockDiscord = new MockDiscord();
    const role = mockDiscord.getRole();
    const country = {
      code: "EA",
      emoji: "🇪🇦",
      unicode: "U+1F1EA U+1F1E6",
      name: "Spain",
      title: "flag for Spain",
    };
    role.name = "Spain 🇪🇸";

    expect(CountryRoleFinder.isRoleFromCountry(country, role)).toBeTruthy();
  });

  it("should find countries in messages", () => {
    const cases: [string, string[]][] = [
      ["Finland", ["Finland"]],
      ["🇪🇦", ["Spain"]],
      ["the UK 🇬🇧", ["UK"]],
      ["🏴󠁧󠁢󠁷󠁬󠁳󠁿", ["Wales"]],
      ["🇦🇽 Finland", ["Finland"]],
      ["🇮🇳 🇮🇳 🇮🇳 🇮🇳", ["India"]],
      ["🇮🇳🇮🇳🇮🇳", ["India"]],
      ["🏴󠁧󠁢󠁷󠁬󠁳󠁿🇮🇳", ["India", "Wales"]],
      ["🇮🇳🇳🇮", ["India", "Nicaragua"]],
      ["🏴󠁧󠁢󠁷󠁬󠁳󠁿🇮🇳🇳🇮 Finland", ["Finland", "India", "Nicaragua", "Wales"]],
      ["🇮🇲 🇭🇲", ["Australia", "UK"]],
    ];

    for (const [input, expected] of cases) {
      const countries = CountryRoleFinder.getCountriesFromString(input);
      const names = countries.map((c) => c.name);
      expect(names).toEqual(expected);
    }
  });

  it("should pick the correct role for a country", () => {
    const roleNames = ["Rwanda 🇷🇼", "Finland 🇫🇮", "United Kingdom 🇬🇧"];
    const roles = roleNames.map((n) => {
      const discord = new MockDiscord();
      const role = discord.getRole();
      role.name = n;
      return role;
    });

    const collectionEntries: [string, Role][] = roles.map((r) => [r.name, r]);

    const discord = new MockDiscord();
    const guild = discord.getGuild();
    guild.roles = { cache: new Collection(collectionEntries) } as RoleManager;

    const cases: [string, Role | undefined][] = [
      ["Rwanda", roles[0]],
      ["Åland Islands", roles[1]],
      ["Wales", roles[2]],
    ];

    for (const [input, expected] of cases) {
      const country = countries.find((c) => c.name === input);
      if (!country) throw input;
      const foundRole = CountryRoleFinder.getRoleForCountry(country, guild);
      expect(foundRole).toEqual(expected);
    }
  });
});
