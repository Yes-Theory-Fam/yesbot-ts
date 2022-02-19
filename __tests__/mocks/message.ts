import { Client, GuildMember, Message, TextBasedChannel } from "discord.js";
import { RawMessageData } from "discord.js/typings/rawDataTypes";

export class MockMessage {
  static new(
    channel: TextBasedChannel,
    member: GuildMember,
    client: Client,
    data: RawMessageData
  ): Message {
    const message = Reflect.construct(Message, [client, data]);

    Object.defineProperty(message, "channel", {
      get: () => channel,
    });

    Object.defineProperty(message, "member", {
      get: () => member,
    });

    return message;
  }
}
