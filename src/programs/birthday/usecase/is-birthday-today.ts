import {zonedTimeToUtc} from 'date-fns-tz';

import {Birthday} from '@yes-theory-fam/database/client';

export const isBirthdayToday = (birthday: Birthday, now = new Date(), targetYear: number = now.getFullYear()): boolean => {
  // Requirement: All birthdates are at time 00:00:00
  const birthdayInUtc = zonedTimeToUtc(birthday.birthdate, birthday.timezone);
  const thisTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const nowInUtc = zonedTimeToUtc(now, thisTimezone);
  nowInUtc.setFullYear(targetYear);

  return nowInUtc.getFullYear() === birthdayInUtc.getFullYear() &&
    nowInUtc.getMonth() === birthdayInUtc.getMonth() &&
    nowInUtc.getDate() === birthdayInUtc.getDate();
};
