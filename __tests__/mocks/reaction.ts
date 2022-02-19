import { Client, GuildMember, Message, MessageReaction } from "discord.js";
import { RawMessageReactionData } from "discord.js/typings/rawDataTypes";

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
