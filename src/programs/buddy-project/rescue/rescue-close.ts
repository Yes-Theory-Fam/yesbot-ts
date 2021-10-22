import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../../event-distribution";
import { MessageReaction, ThreadChannel, User } from "discord.js";
import { ChatNames } from "../../../collections/chat-names";

@Command({
  event: DiscordEvent.REACTION_ADD,
  emoji: "✅",
  parentNames: [ChatNames.BUDDY_PROJECT_INFO],
})
class RescueClose extends CommandHandler<DiscordEvent.REACTION_ADD> {
  async handle(reaction: MessageReaction, user: User): Promise<void> {
    const channel = reaction.message.channel;
    if (!(channel instanceof ThreadChannel)) return;

    if (!channel.name.endsWith(`(${user.id})`)) {
      await channel.send(
        `${user}, only the creator of the thread may close it prematurely.`
      );
      return;
    }

    await channel.delete();
  }
}
