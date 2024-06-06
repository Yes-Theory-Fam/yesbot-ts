import { Client, GuildMember, Message, TextBasedChannel } from "discord.js";
import { PrivateConstructorParameters } from "./_private-constructor-params.js";

type RawMessageData = PrivateConstructorParameters<typeof Message>[1];

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
