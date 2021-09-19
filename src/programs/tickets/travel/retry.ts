import {
  Command,
  CommandHandler,
  DiscordEvent,
  EventLocation,
} from "../../../event-distribution";
import { Message, TextChannel } from "discord.js";
import { getChannelName, TicketType } from "../common";
import Tools from "../../../common/tools";
import { promptAndSendForApproval } from "./common";

@Command({
  event: DiscordEvent.MESSAGE,
  trigger: "!retry",
  location: EventLocation.SERVER,
  description:
    "Allows refilling the form in case a former attempt has been declined.",
})
class RetryTravelTicket extends CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message): Promise<void> {
    const acceptedChannelName = getChannelName(
      message.author,
      TicketType.TRAVEL
    );
    const originChannel = message.channel as TextChannel;
    const targetChannel = message.guild!.channels.cache.find(
      (c) => c.name === acceptedChannelName
    ) as TextChannel;

    if (originChannel.name !== acceptedChannelName) {
      await Tools.handleUserError(
        message,
        `Please send the retry command in your ticket channel: <#${targetChannel.id}>`
      );
      return;
    }

    await promptAndSendForApproval(targetChannel, message.author.id);
  }
}
