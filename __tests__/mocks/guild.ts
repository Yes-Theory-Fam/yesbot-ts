import { Client, Guild, GuildMember, Snowflake } from "discord.js";
import { RawGuildData } from "discord.js/typings/rawDataTypes";

export class MockGuild extends Guild {
  _members: GuildMember[] = [];

  constructor(client: Client, data: RawGuildData) {
    super(client, data);

    Object.defineProperty(this, "members", {
      get: () => ({
        resolve: (id: Snowflake) => this._members.find((m) => m.id === id),
      }),
    });

    // Object.defineProperty(this, "roles", {
    //   get: () => ({
    //     everyone: { id: "test" },
    //   }),
    // });
  }

  addMember(member: GuildMember) {
    this._members.push(member);
  }
}
