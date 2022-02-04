import { Client, GuildMember, Message, TextBasedChannel } from "discord.js";
import { RawMessageData } from "discord.js/typings/rawDataTypes";

// @ts-expect-error: https://github.com/discordjs/discord.js/issues/6798
export class MockMessage extends Message {
  constructor(
    channel: TextBasedChannel,
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
