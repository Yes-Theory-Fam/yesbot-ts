import { ChatNames } from "../collections/chat-names.js";
import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../event-distribution/index.js";
import { ChannelType, ThreadChannel } from "discord.js";

@Command({
  event: DiscordEvent.THREAD_CREATE,
  newlyCreated: true,
  parentName: ChatNames.FEATURE_REQUEST,
})
class FeatureRequestPending
  implements CommandHandler<DiscordEvent.THREAD_CREATE>
{
  async handle(channel: ThreadChannel, _unused: boolean): Promise<void> {
    const parent = channel.parent;
    if (!parent || parent.type !== ChannelType.GuildForum) return;

    const pendingTag = parent.availableTags.find(
      (t) => t.name.toLowerCase() === "pending"
    );
    if (!pendingTag) return;

    await channel.setAppliedTags([...channel.appliedTags, pendingTag.id]);
  }
}
