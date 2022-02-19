import { Client, Collection, Guild, GuildMember } from "discord.js";
import { RawGuildMemberData } from "discord.js/typings/rawDataTypes";

export class MockGuildMember {
  static new(
    client: Client,
    data: RawGuildMemberData,
    guild: Guild
  ): GuildMember {
    const member = Reflect.construct(GuildMember, [client, data, guild]);

    Object.defineProperty(member, "roles", {
      get: () => ({
        cache: new Collection([]),
      }),
    });

    return member;
  }
}
