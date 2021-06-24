import { CountryRoleFinder } from "../../src/utils/country-role-finder";

describe("CountryRoleFinder", () => {
  it("should find as country-role", () => {
    expect(
      CountryRoleFinder.isCountryRole("USA (West) :flag_us:")
    ).toBeTruthy();
    expect(CountryRoleFinder.isCountryRole("Germany :flag_de:")).toBeTruthy();
  });

  it("should not find as country-role", () => {
    expect(CountryRoleFinder.isCountryRole("Award Winner :eyes:")).toBeFalsy();
    expect(CountryRoleFinder.isCountryRole("Award Winner 🏅")).toBeFalsy();
  });

  it("should return the country-name", () => {
    expect(CountryRoleFinder.getCountryByRole("USA (West) :flag_us:")).toMatch(
      "USA (West)"
    );
    expect(CountryRoleFinder.getCountryByRole("Germany :flag_de:")).toMatch(
      "Germany"
    );
  });
});
