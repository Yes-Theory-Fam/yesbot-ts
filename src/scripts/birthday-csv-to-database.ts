import prisma from "../prisma";
import fs from "fs";

import { Birthday } from "@yes-theory-fam/database/client";
import { BirthdayManagerTools } from "../programs";
import { setTimeout } from "timers";
import { zonedTimeToUtc } from "date-fns-tz";
import { exit } from "process";

interface CSVBirthday {
  0: string; // UserId
  1: string; // UserName
  2: string; // NickName
  3: string; // MonthDateDisplay
  4: number; // Month
  5: number; // Day
  // 6: string; // Timezone (we don't get this from birthdaybot)
  [key: number]: string | number;
}

interface BirthdayCollection {
  [key: string]: Birthday;
}

const debug = false;

async function importBirthdaysCsvToDatabase(filename: string) {
  let timezoneRow: number;

  const rawBirthdays = fs
    .readFileSync(filename, "utf-8")
    .replace("\r\n", "\n")
    .split("\n");

  // Cheeky hack. We know that some values are only numbers, so if we check the
  // first row for all fields only being letters, we can assume the first row is a header
  const hasHeaders = rawBirthdays[0].split(",").every((col) => /\w+/.test(col));
  if (!hasHeaders) {
    console.error(
      "CSV file is missing CSV headers. I don't know if any of the headers contain a timezone, so I can't help you!"
    );
    return;
  } else {
    timezoneRow = rawBirthdays[0]
      .split(",")
      .map((col) => col.toLowerCase())
      .indexOf("timezone");
    if (timezoneRow === -1) {
      console.error(
        "No CSV header with timezone information. I can't help you, sorry!"
      );
      return;
    }
  }

  // And if so, we skip it.
  const csvBirthdays = (hasHeaders ? rawBirthdays.splice(1) : [...rawBirthdays])
    .filter((row) => row.length > 0) // Also skip empty rows (empty final newline, for example)
    .map((row) => (<unknown>row.split(",")) as CSVBirthday);
  console.log(`Read ${csvBirthdays.length} birthdays from ${filename}`);
  if (debug) {
    [0, 1, 2, 3, 4].forEach((n) =>
      console.debug(
        `First row: ${csvBirthdays[n]} | timezone in row ${timezoneRow} (${csvBirthdays[n][timezoneRow]})`
      )
    );
  }

  const existingBirthdays = await prisma.birthday.findMany();
  const existingBirthdayUsers = existingBirthdays.map((b) => b.userId);

  const birthdays = await Promise.all(
    csvBirthdays
      .filter((row) => !existingBirthdayUsers.includes(row[0]))
      .map(async (row) => {
        const userid = row[0];
        const year = 1970;
        const birthmonth = row[4] - 1;
        const birthdayofmonth = row[5];
        const timezone =
          timezoneRow !== -1 ? (row[timezoneRow] as string) : null;
        if (debug) {
          console.log(
            `creating bday with new Date(1970, ${birthmonth}, ${birthdayofmonth}) in ${timezone}`
          );
          console.log(
            "\t => standard ",
            new Date(1970, birthmonth, birthdayofmonth)
          );
          console.log(
            "\t => zoned    ",
            zonedTimeToUtc(
              new Date(1970, birthmonth, birthdayofmonth),
              timezone
            )
          );
        }
        return BirthdayManagerTools.createBirthday(
          userid,
          new Date(year, birthmonth, birthdayofmonth),
          timezoneRow === -1 ? null : timezone
        );
      })
  );

  const toCreate = birthdays.reduce<BirthdayCollection>(
    (prev, curr) => ({
      ...prev,
      [curr.userId]: curr,
    }),
    {}
  );

  if (Object.keys(toCreate).length === 0) {
    console.log("No new birthdays to insert.");
    return;
  }

  console.log(`Creating ${Object.keys(toCreate).length} birthdays.`);

  if (debug) {
    Object.keys(toCreate)
      .slice(0, 4)
      .forEach((key) =>
        console.debug(
          `First row (parsed): ${toCreate[key].userId}:${toCreate[key].birthdate}`
        )
      );
  }

  try {
    // TODO see if this blows up
    const newBirthdays = Object.keys(toCreate)
      .map((key) => toCreate[key])
      .reduce((prev, curr) => [...prev, curr], []);

    await prisma.birthday.createMany({ data: newBirthdays });
  } catch (err) {
    console.log("Failed to mass-import birthdays. Error: ", err);
  }

  console.log("Done");
  return;
}

const argv = [...process.argv].filter(
  (arg) =>
    !arg.includes("npx") && !arg.includes("ts-node") && !arg.includes(".ts")
);

const filename = argv[0];
if (argv.length === 0 || !filename.toLowerCase().endsWith(".csv")) {
  console.error(
    `Missing CSV file to import. Execute command again with\n\n\tts-node birthdaysCsvToDatabase.ts ./path/to/file.csv\n`
  );
  exit(1);
} else {
  setTimeout(() => importBirthdaysCsvToDatabase(filename), 1000);
}
