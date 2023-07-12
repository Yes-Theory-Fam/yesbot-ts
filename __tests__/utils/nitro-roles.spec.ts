import {
  getCurrentSeason,
  isNewSeason,
} from "../../src/programs/nitro-colors/common";

describe("NitroRoles", () => {
  it("should output the proper seasons", () => {
    expect(getCurrentSeason(1)).toMatchObject({ season: "winter" }); // January
    expect(getCurrentSeason(4)).toMatchObject({ season: "spring" }); // April
    expect(getCurrentSeason(3)).toMatchObject({ season: "spring" }); // March
    expect(getCurrentSeason(7)).toMatchObject({ season: "summer" }); // July

    expect(getCurrentSeason(13)).toMatchObject({ season: "winter" }); // January
    expect(getCurrentSeason(16)).toMatchObject({ season: "spring" }); // January

    expect(getCurrentSeason(-5)).toBe(null);
  });

  it("should properly figure out whether a new season is around", () => {
    expect(isNewSeason(3)).toBeTruthy(); // March
    expect(isNewSeason(4)).toBeFalsy(); // April

    expect(isNewSeason(6)).toBeTruthy(); // June
    expect(isNewSeason(7)).toBeFalsy(); // July

    expect(isNewSeason(12)).toBeTruthy(); // December

    expect(isNewSeason(0)).toBeFalsy();
    expect(isNewSeason(-5)).toBeFalsy();
  });
});
