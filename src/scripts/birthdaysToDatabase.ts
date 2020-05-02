import "../db"; // imported for side effect
import Tools from "../common/tools";
import { BirthdayRepository, Birthday } from "../entities/Birthday";
import { getUserBirthdate } from "../programs/BirthdayManager";
import { setTimeout } from "timers";

interface JSONBirthday {
  id: string;
  date: string;
}

async function importBirthdaysToDatabase() {
  const birthdayRepository = await BirthdayRepository();
  const birthdays = (<unknown>(
    await Tools.resolveFile("birthdayMembers")
  )) as JSONBirthday[];

  const existingBirthdays = await birthdayRepository.find();
  const existingBirthdayUsers = existingBirthdays.map((b) => b.userid);

  const toCreate = birthdays
    .filter(({ id }) => existingBirthdayUsers.indexOf(id) === -1)
    .map(({ id, date }) =>
      birthdayRepository.create({
        userid: id,
        birthdate: getUserBirthdate(date),
      })
    );

  console.log(
    `Found ${toCreate.length} birthdays to import. Skipping ${existingBirthdayUsers.length} existing birthdays.`
  );

  if (toCreate.length === 0) {
    console.log("No new birthdays to insert.");
    return;
  }

  try {
    await birthdayRepository
      .createQueryBuilder()
      .insert()
      .into(Birthday)
      .values(toCreate)
      .execute();
  } catch (err) {
    console.log("Failed to mass-import birthdays. Error: ", err);
  }

  console.log("Done");
  return;
}

setTimeout(importBirthdaysToDatabase, 1000);
