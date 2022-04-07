import { Birthday } from "@yes-theory-fam/database/client";
import { utcToZonedTime } from "date-fns-tz";
import prisma from "../../../prisma";

export class GetUserBirthdayUseCase {
  async getUserBirthday(userId: string): Promise<Date | null> {
    const birthday = await prisma.birthday.findUnique({ where: { userId } });

    return birthday?.timezone
      ? utcToZonedTime(birthday.birthdate, birthday.timezone)
      : null;
  }
}
