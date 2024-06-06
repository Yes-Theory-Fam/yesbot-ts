import { Client, Collection, Guild, GuildMember } from "discord.js";
import { PrivateConstructorParameters } from "./_private-constructor-params.js";

type RawGuildMemberData = PrivateConstructorParameters<typeof GuildMember>[1];

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
