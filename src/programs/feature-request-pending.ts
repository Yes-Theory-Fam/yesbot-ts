import { ChatNames } from "../collections/chat-names.js";
import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../event-distribution/index.js";
import { ChannelType, ThreadChannel } from "discord.js";

export const featureRequestPendingCoverage = [0,0,0];

@Command({
  event: DiscordEvent.THREAD_CREATE,
  newlyCreated: true,
  parentName: ChatNames.FEATURE_REQUEST,
})
export class FeatureRequestPending
  implements CommandHandler<DiscordEvent.THREAD_CREATE>
{
  async handle(channel: ThreadChannel, _unused: boolean): Promise<void> {
    const parent = channel.parent;
    if (!parent || parent.type !== ChannelType.GuildForum){
      if (!parent) featureRequestPendingCoverage[0] = 1;
      else featureRequestPendingCoverage[1] = 1;
      return;
    }

    const pendingTag = parent.availableTags.find(
      (t) => t.name.toLowerCase() === "pending"
    );
    if (!pendingTag){
      featureRequestPendingCoverage[2] = 1;
      return;
    }

    await channel.setAppliedTags([...channel.appliedTags, pendingTag.id]);
  }
}
