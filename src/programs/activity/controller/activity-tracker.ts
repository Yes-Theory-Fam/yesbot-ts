import { Message } from "discord.js";
import {
  Command,
  CommandHandler,
  DiscordEvent,
  EventLocation,
} from "../../../event-distribution";
import { UpdateActivity } from "../usecase/update-activity";
import { ChatNames } from "../../../collections/chat-names";

@Command({
  event: DiscordEvent.MESSAGE,
  channelNames: [
    ChatNames.BOT_DEVELOPMENT, // we will start in this channel while this feature is under development
  ],
  description: "This handler tracks the activity of users on this server.",
})
export class ActivityTracker implements CommandHandler<DiscordEvent.MESSAGE> {
  public async handle(arg: Message): Promise<void> {
    await UpdateActivity.instance().handle({ userId: arg.author.id });
  }
}
