import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../../event-distribution";
import { Message } from "discord.js";
import { maybeCreateTicket, TicketType } from "../common";
import { promptAndSendForApproval } from "./common";
import Tools from "../../../common/tools";
import { ChatNames } from "../../../collections/chat-names";

@Command({
  event: DiscordEvent.MESSAGE,
  trigger: "!travel",
  description: "This handler is to create a travel ticket.",
  stateful: false,
})
class OpenTravelTicket implements CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message): Promise<void> {
    // It's not possible yet to react to missing permissions. See #496
    if (!message.member.roles.cache.some((r) => r.name === "Seek Discomfort")) {
      const introductions = message.guild!.channels.cache.find(
        (c) => c.name === ChatNames.INTRODUCTIONS
      );
      await Tools.handleUserError(
        message,
        `Before meeting up with people, it's probably best to let others know who you are! This command requires the 'Seek Discomfort' role which you can get by introducing yourself in <#${introductions.id}>`
      );

      return;
    }

    const channel = await maybeCreateTicket(
      message,
      TicketType.TRAVEL,
      `Hi ${message.member.toString()}, let's collect all important information for your trip!`,
      false
    );

    if (!channel) return;

    await promptAndSendForApproval(channel, message.author.id);
  }
}
