import { Client, Collection, Guild, GuildMember } from "discord.js";
import { RawGuildMemberData } from "discord.js/typings/rawDataTypes";

// @ts-expect-error: https://github.com/discordjs/discord.js/issues/6798
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
