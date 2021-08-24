import { Client, Collection, Guild, GuildMember } from "discord.js";
import { RawGuildMemberData } from "discord.js/typings/rawDataTypes";

export class MockGuildMember extends GuildMember {
  constructor(client: Client, data: RawGuildMemberData, guild: Guild) {
    super(client, data, guild);

    Object.defineProperty(this, "roles", {
      get: () => ({
        cache: new Collection([]),
      }),
    });
  }
}
