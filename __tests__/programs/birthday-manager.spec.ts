import { getUserBirthdate } from "../../src/programs/birthday-manager";

const messages: Array<Array<string | Date | null>> = [
  ["dec-24", new Date(1972, 11, 24)],
  ["dec 4", new Date(1972, 11, 4)],
  ["Dec 4", new Date(1972, 11, 4)],
  ["dec 04", new Date(1972, 11, 4)],
  ["december 24", new Date(1972, 11, 24)],
  ["24/12", new Date(1972, 11, 24)],
  ["12/24", new Date(1972, 11, 24)],
  ["feb-2", new Date(1972, 1, 2)],
  ["jan/2", new Date(1972, 0, 2)],
  ["2/1", null],
  ["12 10", null],
  ["12 12", new Date(1972, 11, 12)],
  ["november 3rd", new Date(1972, 10, 3)],
  ["05.20", new Date(1972, 4, 20)],
  ["02.29", new Date(1972, 1, 29)], // Allow having birthday on 29th of february
];

describe("birthday manager", () => {
  messages.forEach((msg) => {
    it('should match the expected date', () => {
      const dateStr = msg[0] as string;
      const date = msg[1] as Date | null;
      expect(getUserBirthdate(dateStr)).toEqual(date);
    })
  });
});
