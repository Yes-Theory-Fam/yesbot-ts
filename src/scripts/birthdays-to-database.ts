import Tools from "../common/tools";
import { getUserBirthdate } from "../programs/birthday-manager";
import { setTimeout } from "timers";
import prisma from "../prisma";

interface JSONBirthday {
  id: string;
  date: string;
}

async function importBirthdaysToDatabase() {
  const birthdays = (<unknown>(
    await Tools.resolveFile("birthdayMembers")
  )) as JSONBirthday[];

  const existingBirthdays = await prisma.birthday.findMany();
  const existingBirthdayUsers = existingBirthdays.map((b) => b.userId);

  const toCreate = birthdays
    .filter(({ id }) => !existingBirthdayUsers.includes(id))
    .map(({ id, date }) => ({
      userId: id,
      birthdate: getUserBirthdate(date),
    }));

  console.log(
    `Found ${toCreate.length} birthdays to import. Skipping ${existingBirthdayUsers.length} existing birthdays.`
  );

  if (toCreate.length === 0) {
    console.log("No new birthdays to insert.");
    return;
  }

  try {
    await prisma.birthday.createMany({ data: toCreate });
  } catch (err) {
    console.log("Failed to mass-import birthdays. Error: ", err);
  }

  console.log("Done");
  return;
}

setTimeout(importBirthdaysToDatabase, 1000);
