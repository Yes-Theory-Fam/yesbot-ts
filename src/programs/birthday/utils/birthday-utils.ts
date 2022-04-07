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

export function formatBirthday(date: Date | null): string {
  return date === null
    ? "Unknown"
    : `${months[date.getMonth()]}-${date.getDate()}`;
}
