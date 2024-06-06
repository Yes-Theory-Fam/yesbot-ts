import { Client, GuildMember, Message, MessageReaction } from "discord.js";
import { PrivateConstructorParameters } from "./_private-constructor-params.js";

type RawMessageReactionData = PrivateConstructorParameters<
  typeof MessageReaction
>[1];

export class MockMessageReaction {
  static new(
    member: GuildMember,
    client: Client,
    data: RawMessageReactionData,
    message: Message
  ): MessageReaction {
    const reaction = Reflect.construct(MessageReaction, [
      client,
      data,
      message,
    ]);

    Object.defineProperty(reaction, "member", {
      get: () => member,
    });

    return reaction;
  }
}
