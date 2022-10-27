import { Command, CommandHandler, DiscordEvent } from "../event-distribution";
import { Message } from "discord.js";
import { ChatNames } from "../collections/chat-names";
import Tools from "../common/tools";

@Command({
  event: DiscordEvent.MESSAGE,
  channelNames: [ChatNames.STRANGERS_TO_FRIENDS],
  description:
    "This handler is for autoassigning the from strangers to friends roles to everyone mentioned in a post.",
})
class FromStrangersToFriends implements CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message): Promise<void> {
    if (!message.guild) return;
    const users = message.mentions.members;
    const role = Tools.getRoleByName(
      "From Strangers To Friends 📸",
      message.guild
    );

    if (!users || !role) return;
    for (const user of users.values()) {
      if (!user.roles?.cache.has(role.id)) {
        await user.roles.add(role.id);
      }
    }
  }
}
