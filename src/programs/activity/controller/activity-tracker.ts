import { Message } from "discord.js";
import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../../event-distribution";
import { UpdateActivity } from "../usecase/update-activity";
import { ChatNames } from "../../../collections/chat-names";

@Command({
  event: DiscordEvent.MESSAGE,
  parentNames: [
    "Africa",
    "Asia",
    "Chatting",
    "Europe",
    "Gaming",
    "Hobbies",
    "North America",
    "Oceania",
    "South America",
  ],
  channelNames: [ChatNames.BOT_DEVELOPMENT],
  description: "This handler tracks the activity of users on this server.",
})
export class ActivityTracker implements CommandHandler<DiscordEvent.MESSAGE> {
  public async handle(arg: Message): Promise<void> {
    await UpdateActivity.instance().handle({ userId: arg.author.id });
  }
}
