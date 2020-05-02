import { getUserBirthdate } from "./BirthdayManager";

const messages = [
  ["dec-24", new Date(1970, 11, 24)],
  ["dec 4", new Date(1970, 11, 4)],
  ["dec 04", new Date(1970, 11, 4)],
  ["december 24", new Date(1970, 11, 24)],
  ["24/12", new Date(1970, 11, 24)],
  ["12/24", new Date(1970, 11, 24)],
  ["feb-2", new Date(1970, 1, 2)],
  ["jan/2", new Date(1970, 0, 2)],
  ["2/1", null],
  ["12 10", null],
  ["12 12", new Date(1970, 11, 12)],
  ["november 3rd", new Date(1970, 10, 3)],
  ["05.20", new Date(1970, 4, 20)],
];

const errors = messages
  .map((m) => {
    const dateStr = m[0] as string;
    const expected = m[1] as Date | null;

    const birthdate = getUserBirthdate(dateStr);
    if (expected === null && birthdate === null) {
      // Both are null, all is OK
      return "";
    }

    if (birthdate === null || (expected === null && birthdate !== null)) {
      return `Got '${birthdate}', expected '${expected}' for '${dateStr}'`;
    }

    // They should have same date, so only return those with different dates
    return getUserBirthdate(dateStr).getTime() === expected.getTime()
      ? ""
      : `Got '${birthdate}', expected '${expected}' for '${dateStr}'`;
  })
  .filter((m) => m.length > 0);

if (errors.length > 1) {
  console.log(`${errors.length} Errors`);
  errors.forEach((e) => console.log(e));
}
