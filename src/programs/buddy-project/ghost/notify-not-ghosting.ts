import {
  Command,
  CommandHandler,
  DiscordEvent,
  EventLocation,
} from "../../../event-distribution";
import {
  Client,
  MessageReaction,
  PartialDMChannel,
  Snowflake,
  User,
} from "discord.js";
import prisma from "../../../prisma";
import { ghostWarningMessageRegex } from "./constants";

@Command({
  event: DiscordEvent.REACTION_ADD,
  contentRegex: ghostWarningMessageRegex,
  location: EventLocation.DIRECT_MESSAGE,
  emoji: "✅",
})
class NotifyNotGhosting extends CommandHandler<DiscordEvent.REACTION_ADD> {
  async handle(reaction: MessageReaction, user: User): Promise<void> {
    const dm = reaction.message.channel as PartialDMChannel;
    const entry = await this.findEntry(user.id);
    await this.clearGhostingDate(entry.buddyId);
    await this.notifyBuddy(entry.buddyId, reaction.client);
    await this.notifyGhoster(dm);
  }

  findEntry(userId: Snowflake) {
    return prisma.buddyProjectEntry.findUnique({ where: { userId } });
  }

  async notifyBuddy(buddyId: Snowflake, client: Client) {
    const guild = client.guilds.resolve(process.env.GUILD_ID);
    const buddyMember = guild.members.resolve(buddyId);
    const buddyDm = await buddyMember.createDM();
    await buddyDm.send(
      "Hey there! Your buddy just reacted to my message, so hopefully they will reach out to you soon."
    );
  }

  async notifyGhoster(channel: PartialDMChannel) {
    await channel.send(
      "Glad to see you are still with us! Now don't forget to message your buddy ;)"
    );
  }

  async clearGhostingDate(reporterUserId: Snowflake) {
    await prisma.buddyProjectEntry.update({
      where: { userId: reporterUserId },
      data: { reportedGhostDate: null },
    });
  }
}
