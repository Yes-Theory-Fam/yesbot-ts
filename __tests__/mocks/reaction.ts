import { Client, GuildMember, Message, MessageReaction } from "discord.js";
import { RawMessageReactionData } from "discord.js/typings/rawDataTypes";

export class MockMessageReaction extends MessageReaction {
  constructor(
    member: GuildMember,
    client: Client,
    data: RawMessageReactionData,
    message: Message
  ) {
    super(client, data, message);

    Object.defineProperty(this, "member", {
      get: () => member,
    });
  }
}
