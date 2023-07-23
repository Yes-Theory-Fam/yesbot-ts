import { APIRole, Guild, Message, Role, Snowflake } from "discord.js";

export type TripDetails = {
  userId: Snowflake;

  countryRoles: (Role | APIRole)[];
  places: string;
  dates: string;
  activities: string;
  needsHost: boolean;
};

export class TravelDataMessageConverter {
  static toMessage(details: TripDetails, roleMentions = false): string {
    return `Hey ${details.countryRoles
      .map((r) => (roleMentions ? r.toString() : r.name))
      .join(", ")}!
    
**Who's traveling**: <@${details.userId}>
**Where**: ${details.places}
**When**: ${details.dates}
**Looking for a host**: ${details.needsHost ? "Yes" : "No"}
**Activities**: ${details.activities}`;
  }

  static fromMessage(message: Message, guild: Guild): TripDetails {
    const content = message.content;

    const countryNameMatch = /Hey (.*)!$/gm.exec(content);
    const countryNames = countryNameMatch?.at(1)?.split(/\s*,\s*/) ?? [];
    const countryRoles = countryNames
      .map((name) => guild.roles.cache.find((r) => r.name === name))
      .filter((x): x is Role => !!x);

    const userId = message.mentions.users.first()?.id ?? message.author.id;

    const whereMatch = /\*\*Where\*\*: ((?:.|\n)*?)\*\*When\*\*/gm.exec(
      content
    );
    const where = whereMatch?.at(1)?.trim() ?? "";

    const whenMatch =
      /\*\*When\*\*: ((?:.|\n)*?)\*\*Looking for a host\*\*/gm.exec(content);
    const when = whenMatch?.at(1)?.trim() ?? "";

    const hostMatch = /\*\*Looking for a host\*\*: (Yes|No)/gm.exec(content);
    const needsHost = hostMatch?.at(1) === "Yes";

    const activitiesMatch = /\*\*Activities\*\*:((?:.|\n).*)/gm.exec(content);
    const activities = activitiesMatch?.at(1) ?? "";

    return {
      userId,
      countryRoles,
      places: where,
      dates: when,
      activities,
      needsHost,
    };
  }
}
