import { Command, CommandHandler, DiscordEvent } from "../event-distribution";
import { GuildMember, Message } from "discord.js";

@Command({
  event: DiscordEvent.MESSAGE,
  channelNames: ["from-strangers-to-friends"],
  description:
    "This handler is for autoassigning the from strangers to friends roles to everyone mentioned in a post.",
})
class FromStrangersToFriends implements CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message): Promise<void> {
    let users = message.mentions?.members;

    users?.forEach((user: GuildMember) => {
      if (user.roles?.cache.has("499143174271270913")) {
        return;
      } else {
        user.roles.add("499143174271270913");
        return;
      }
    });
  }
}
