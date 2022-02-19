import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../../event-distribution";
import {
  Collection,
  Guild,
  GuildMember,
  Message,
  MessageReaction,
  Snowflake,
  TextChannel,
  ThreadChannel,
  User,
} from "discord.js";
import { ChatNames } from "../../../collections/chat-names";
import { closeTicket, getChannelName, TicketType } from "../common";
import { createYesBotLogger } from "../../../log";

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

    const ticketMember = ApproveTravelTicket.parseOriginMember(message);
    const thread = await ApproveTravelTicket.startThread(
      message,
      content,
      ticketMember
    );

    try {
      await ApproveTravelTicket.includeTravelingMembers(
        message.mentions.members,
        thread
      );
    } catch {
      logger.info(
        "Failed to add some members to the travel thread; if no-one complains, this is probably not actionable"
      );
    }

    await ApproveTravelTicket.recordApproval(message.guild, user, message);
    await ApproveTravelTicket.closeTicket(ticketMember.user, message.guild);
  }

  // message.mentions.members.first() might return a member other than the
  // intended one because `first` depends on the userId and not the point of
  // occurence within the message
  private static parseOriginMember(message: Message): GuildMember {
    const regex = /\*\*Who.*?\*\*: <@(\d+)>/g;
    const [, userId] = regex.exec(message.content);
    return message.guild.members.resolve(userId);
  }

  private static async startThread(
    message: Message,
    content: string,
    ticketMember: GuildMember
  ) {
    const travelingTogether = message.guild!.channels.cache.find(
      (c) => c.name === ChatNames.TRAVELING_TOGETHER
    ) as TextChannel;
    const travelMessage = await travelingTogether.send({
      content,
      allowedMentions: {
        parse: ["roles", "users"],
      },
    });
    const threadName = `${
      ticketMember.displayName
    } in ${ApproveTravelTicket.resolveTraveledPlace(message.cleanContent)}`;

    const trimmedThreadName = threadName.substring(0, 100);

    return await travelMessage.startThread({
      autoArchiveDuration: "MAX",
      name: trimmedThreadName,
    });
  }

  private static async recordApproval(
    guild: Guild,
    user: User,
    message: Message
  ) {
    const reactingMember = guild.members.resolve(user.id);
    await message.reactions.removeAll();
    const { content } = message;
    await message.edit(
      content + `\n\nApproved by ${reactingMember.displayName}`
    );
  }

  private static async closeTicket(ticketAuthor: User, guild: Guild) {
    const channelName = getChannelName(ticketAuthor, TicketType.TRAVEL);
    const channel = guild!.channels.cache.find(
      (c) => c.name === channelName
    ) as TextChannel;
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

const logger = createYesBotLogger("travel", ApproveTravelTicket.name);
