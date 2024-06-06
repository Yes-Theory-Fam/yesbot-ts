import { Client, Guild, GuildMember, Snowflake } from "discord.js";
import { PrivateConstructorParameters } from "./_private-constructor-params.js";

type RawGuildData = PrivateConstructorParameters<typeof Guild>[1];

export interface GuildMock extends Guild {
  addMember(member: GuildMember): void;
}

export class MockGuild {
  static new(client: Client, data: RawGuildData): GuildMock {
    const members: GuildMember[] = [];

    const guild = Reflect.construct(Guild, [client, data]) as GuildMock;

    const addMember = (member: GuildMember) => members.push(member);

    Object.defineProperty(guild, "addMember", { get: () => addMember });

    Object.defineProperty(guild, "members", {
      get: () => ({
        resolve: (id: Snowflake) => members.find((m) => m.id === id),
      }),
    });

    return guild;
  }
}
