import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../../event-distribution";
import {
  Collection,
  GuildMember,
  MessageReaction,
  Snowflake,
  TextChannel,
  ThreadChannel,
  User,
} from "discord.js";
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

    // Guard against two mods voting at the same time.
    const content = message.content;
    const lines = content.split("\n");
    if (!lines[lines.length - 1].startsWith("Click on the thread")) {
      return;
    }

    const ticketMember = message.mentions.members.first();
    const ticketAuthor = ticketMember.user;

    const channelName = getChannelName(ticketAuthor, TicketType.TRAVEL);
    const channel = message.guild!.channels.cache.find(
      (c) => c.name === channelName
    ) as TextChannel;

    const travelingTogether = message.guild!.channels.cache.find(
      (c) => c.name === ChatNames.TRAVELING_TOGETHER
    ) as TextChannel;
    const travelMessage = await travelingTogether.send(content);
    const threadName = `${
      ticketMember.displayName
    } in ${ApproveTravelTicket.resolveTraveledPlace(message.cleanContent)}`;

    const thread = await travelMessage.startThread({
      autoArchiveDuration: "MAX",
      name: threadName,
    });

    await ApproveTravelTicket.includeTravelingMembers(
      message.mentions.members,
      thread
    );

    const reactingMember = channel.guild.members.resolve(user.id);
    await message.reactions.removeAll();
    await message.edit(
      content + `\n\nApproved by ${reactingMember.displayName}`
    );
    await closeTicket(channel, ticketAuthor, TicketType.TRAVEL.toLowerCase());
  }

  private static resolveTraveledPlace(message: string) {
    const regex = /^\*\*Where\*\*: (.*)$/gm;
    const match = regex.exec(message);
    return match[1];
  }

  private static async includeTravelingMembers(
    members: Collection<Snowflake, GuildMember>,
    thread: ThreadChannel
  ) {
    const promises = members.map((m) => thread.members.add(m));
    return Promise.all(promises);
  }
}
