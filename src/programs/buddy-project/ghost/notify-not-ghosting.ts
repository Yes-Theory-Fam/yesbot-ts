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
import { BuddyProjectService } from "../services/buddy-project.service";
import { ghostWarningMessageRegex } from "./constants";

@Command({
  event: DiscordEvent.REACTION_ADD,
  contentRegex: ghostWarningMessageRegex,
  location: EventLocation.DIRECT_MESSAGE,
  emoji: "✅",
})
class NotifyNotGhosting extends CommandHandler<DiscordEvent.REACTION_ADD> {
  async handle(reaction: MessageReaction, user: User): Promise<void> {
    const bpService = new BuddyProjectService();
    const entry = await bpService.getBuddy(user.id);

    const dm = reaction.message.channel as PartialDMChannel;

    await bpService.markAsNotGhosting(user.id);

    const ghostedId = entry.buddy?.userId;
    if (!ghostedId) {
      throw new Error("Cannot mark as not ghosting; entry does not have buddy");
    }

    await this.notifyBuddy(ghostedId, reaction.client);
    await this.notifyGhoster(dm);
  }

  async notifyBuddy(buddyId: Snowflake, client: Client) {
    const guild = client.guilds.resolve(process.env.GUILD_ID);
    const buddyMember = guild?.members.resolve(buddyId);
    if (!buddyMember) {
      throw new Error(
        `Could not notify buddy: guild defined: ${!!guild}, buddyMember defined: ${!!buddyMember}`
      );
    }

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
}
