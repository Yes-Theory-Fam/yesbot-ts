import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../../event-distribution";
import { MessageReaction, TextChannel, User } from "discord.js";
import { ChatNames } from "../../../collections/chat-names";
import { closeTicket, getChannelName, TicketType } from "../common";

@Command({
  event: DiscordEvent.REACTION_ADD,
  channelNames: [ChatNames.TRAVEL_APPROVALS],
  allowedRoles: ["Support"],
  emoji: "✅",
  description: "Approves a previously created travel ticket",
})
class ApproveTravelTicket extends CommandHandler<DiscordEvent.REACTION_ADD> {
  async handle(reaction: MessageReaction, user: User): Promise<void> {
    const message = await reaction.message.fetch(true);
    const ticketAuthor = message.mentions.members.first().user;

    const channelName = getChannelName(ticketAuthor, TicketType.TRAVEL);
    const channel = message.guild!.channels.cache.find(
      (c) => c.name === channelName
    ) as TextChannel;

    const travelingTogether = message.guild!.channels.cache.find(
      (c) => c.name === ChatNames.TRAVELING_TOGETHER
    ) as TextChannel;
    const content = message.content;
    await travelingTogether.send(content);

    const reactingMember = channel.guild.members.resolve(user.id);
    await message.edit(
      content + `\n\nApproved by ${reactingMember.displayName}`
    );
    await message.reactions.removeAll();
    await closeTicket(channel, ticketAuthor, TicketType.TRAVEL.toLowerCase());
  }
}
