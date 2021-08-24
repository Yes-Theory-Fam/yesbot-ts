import { Client, GuildMember, Message, TextBasedChannels } from "discord.js";
import { RawMessageData } from "discord.js/typings/rawDataTypes";

export class MockMessage extends Message {
  constructor(
    channel: TextBasedChannels,
    member: GuildMember,
    client: Client,
    data: RawMessageData
  ) {
    super(client, data);

    Object.defineProperty(this, "channel", {
      get: () => channel,
    });

    Object.defineProperty(this, "member", {
      get: () => member,
    });
  }
}
