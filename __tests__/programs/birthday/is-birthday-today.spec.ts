import {Birthday} from '@yes-theory-fam/database/client';
import {isBirthdayToday} from '../../../src/programs/birthday/usecase/is-birthday-today';

const utc = (year: number, month: number, date: number, hour: number = 0) => new Date(Date.UTC(year, month, date, hour));

describe('isBirthdayToday', () => {
  it('should return true if today is the birthday', () => {
    const today = utc(2020, 0, 1);
    const birthday: Birthday = {
      userId: '',
      birthdate: utc(2020, 0, 1),
      timezone: 'Etc/UTC',
    };

    expect(isBirthdayToday(birthday, today)).toBe(true);
  });

  it('should return false if today is not the birthday', () => {
    const today = utc(2020, 0, 1);
    const birthday: Birthday = {
      userId: '',
      birthdate: utc(2020, 0, 2),
      timezone: 'Etc/UTC',
    };

    expect(isBirthdayToday(birthday, today)).toBe(false);
  });

  // TODO name
  it('should return true if the birthday is in a different timezone and still in that timezone', () => {
    const today = utc(2020, 0, 1, 23);
    const birthday: Birthday = {
      userId: '',
      birthdate: utc(2020, 0, 2),
      timezone: 'Europe/Berlin',
    };

    // 2020-01-01T23:00:00.000Z is 2020-01-02T00:00:00.000Z in Europe/Berlin
    expect(isBirthdayToday(birthday, today)).toBe(true);
  });

  // TODO name
  it('should return false if the birthday is in a different timezone and not in that timezone', () => {
    const today = utc(2020, 0, 1, 23);
    const birthday: Birthday = {
      userId: '',
      birthdate: utc(2020, 0, 1),
      timezone: 'Europe/Berlin',
    };

    // 2020-01-01T23:00:00.000Z is 2020-01-02T00:00:00.000Z in Europe/Berlin
    expect(isBirthdayToday(birthday, today)).toBe(false);
  });

  it('works when overriding the reference year', () => {
    const today = utc(2020, 0, 1, 23);
    const birthday: Birthday = {
      userId: '',
      birthdate: utc(1972, 0, 2),
      timezone: 'Etc/UTC',
    };

    expect(isBirthdayToday(birthday, today, 1972)).toBe(true);
  });
});
