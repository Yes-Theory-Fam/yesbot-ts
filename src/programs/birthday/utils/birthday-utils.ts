export const months = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
];

// Using 1972 so we can handle leap years
export const referenceYear = 1972;

export function formatBirthday(date: Date | null): string {
  return date === null
    ? "Unknown"
    : `${months[date.getMonth()]}-${date.getDate()}`;
}
