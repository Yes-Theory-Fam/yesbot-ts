import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../../event-distribution";
import { ChatNames } from "../../../collections/chat-names";
import {
  Client,
  MessageReaction,
  Snowflake,
  TextChannel,
  User,
} from "discord.js";
import prisma from "../../../prisma";

@Command({
  event: DiscordEvent.REACTION_ADD,
  channelNames: [ChatNames.BUDDY_PROJECT_DMS_DISABLED],
  emoji: "✅",
})
class BuddyProjectConfirmDmsUnblocked extends CommandHandler<DiscordEvent.REACTION_ADD> {
  async handle(reaction: MessageReaction, user: User): Promise<void> {
    const dmsWork = await this.ensureDmsWork(user.id, reaction.client);
    if (!dmsWork) {
      await this.rejectConfirmation(reaction, user.id);
    }

    await this.resetBlockedStatus(user.id);

    const textChannel = reaction.message.channel as TextChannel;
    await this.resetChannelPermissions(user.id, textChannel);
  }

  async ensureDmsWork(userId: Snowflake, client: Client) {
    const user = await client.users.fetch(userId);
    try {
      const dm = await user.createDM();
      await dm.send(
        "Hey there!\n\nThis is just a quick test to see if your DMs are set up correctly now. All looks good, so you will be matched soon!"
      );
      return true;
    } catch (e) {
      // Again, assume that this is because of incorrect permissions
      return false;
    }
  }

  async rejectConfirmation(reaction: MessageReaction, userId: Snowflake) {
    await reaction.users.remove(userId);
    const rejectionPing = await reaction.message.channel.send(`<@${userId}>`);
    await rejectionPing.delete();
  }

  async resetBlockedStatus(userId: Snowflake) {
    await prisma.buddyProjectEntry.update({
      where: { userId },
      data: { blocked: false },
    });
  }

  async resetChannelPermissions(userId: Snowflake, channel: TextChannel) {
    await channel.permissionOverwrites.delete(userId);
  }
}
