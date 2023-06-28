import { randomInt } from "crypto";

export interface NitroRole {
  name: string;
  color: string;
}

export interface SeasonGroup {
  season: string;
  emoji: string;
  availability: {
    startMonth: number;
    endMonth: number;
  };
  roles: NitroRole[];
}

export const announcements = {
  normal: [
    "It is time to pick a new color of the new month!",
    "New month, new colors! Pick your favorite ones!",
    "It's time to choose your new signature color for the month! Show off your unique style!",
  ],
  newSeason: [
    "It's time to pick your favorite colors for this new season!",
    "Embrace the colors of the new season and express your style!",
    "Celebrate the arrival of the new season with a different splash of colors!",
    "It's time to revamp your color palette to match the spirit of the new season!",
  ],
  endingSeason: [
    "Grab the current season's colors before they're gone for the year!",
    "Hurry! It's the final opportunity to secure this season's colors for this year!",
    "Last chance to get this season's colors for the year! Don't miss out!",
  ],
};

export const seasons: SeasonGroup[] = [
  {
    season: "winter",
    emoji: "❄️",
    availability: { startMonth: 12, endMonth: 2 },
    roles: [
      { name: "Candlelight", color: "#b10f0a" },
      { name: "Pinetree", color: "#1a7248" },
      { name: "Cinnamon", color: "#ffaa00" },
      { name: "Nighttime", color: "#2c6c9e" },
      { name: "Clementine", color: "#df5b06" },
    ],
  },
  {
    season: "spring",
    emoji: "🌷",
    availability: { startMonth: 3, endMonth: 5 },
    roles: [
      { name: "Veronika 👝", color: "#feaeac" },
      { name: "Pear 🍐", color: "#7dd17d" },
      { name: "Citrus 🍋", color: "#efef7b" },
      { name: "Soda 💧", color: "#a9ccff" },
      { name: "Shrimp 🦐", color: "#ffb066" },
    ],
  },
  {
    season: "summer",
    emoji: "🏖️",
    availability: { startMonth: 6, endMonth: 8 },
    roles: [
      { name: "Icecream", color: "#e0234a" },
      { name: "Meadow", color: "#08bd56" },
      { name: "Sunshine", color: "#e0d41a" },
      { name: "Cloudless", color: "#0fbdb5" },
      { name: "Beachball", color: "#ff491f" },
    ],
  },
  {
    season: "autumn",
    emoji: "🍂",
    availability: { startMonth: 9, endMonth: 11 },
    roles: [
      { name: "Bonfire", color: "#cf453a" },
      { name: "Overgrown", color: "#7ba702" },
      { name: "Pumpkin", color: "#dfac3a" },
      { name: "Moonshine", color: "#1a8391" },
      { name: "Foliage", color: "#d1652b" },
    ],
  },
];

export function getCurrentSeason(month?: number): SeasonGroup | null {
  let currentMonth = month ?? new Date().getMonth() + 1;

  if (currentMonth > 12) {
    currentMonth = currentMonth % 12;
  }

  if (currentMonth < 0) return null;

  for (const season of seasons) {
    const { startMonth, endMonth } = season.availability;

    if (startMonth <= endMonth) {
      if (currentMonth >= startMonth && currentMonth <= endMonth) {
        return season;
      }
    } else {
      // Handle the case when the availability range overlaps with the new year
      if (currentMonth >= startMonth || currentMonth <= endMonth) {
        return season;
      }
    }
  }

  return null;
}

export function isNewSeason(month?: number): boolean {
  let season = getCurrentSeason(month);
  let currentMonth = month ?? new Date().getMonth() + 1;

  return season?.availability.startMonth == currentMonth;
}

export function isSeasonEnding(month?: number): boolean {
  let season = getCurrentSeason(month);
  let currentMonth = month ?? new Date().getMonth() + 1;

  return season?.availability.endMonth == currentMonth;
}

export function buildAnnouncementsMessage(month?: number): string {
  let announcement: string[] = [];
  let randomStr = (arr: string[]): string => arr[randomInt(arr.length)];

  if (isNewSeason(month)) announcement.push(randomStr(announcements.newSeason));
  else announcement.push(randomStr(announcements.normal));

  if (isSeasonEnding(month))
    announcement.push(" " + randomStr(announcements.endingSeason));

  return announcement.join("");
}
