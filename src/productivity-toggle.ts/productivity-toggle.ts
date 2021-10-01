import { Message } from "discord.js";
import { ChatNames } from "../collections/chat-names";
import { hasRole } from "../common/moderator";
import Tools from "../common/tools";
import { Command, CommandHandler, DiscordEvent } from "../event-distribution";
import { isProdVoiceChannel } from "./common";

@Command({
  event: DiscordEvent.MESSAGE,
  trigger: "!toggleProdVC",
  channelNames: [ChatNames.VOICE_CHAT_WIP],
  description:
    "This handler toggles the feature of hiding the channels while in Productivity",
})
class ToggleChannelsInProdVC implements CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message): Promise<void> {
    const guildMember = message.member;

    if (!isProdVoiceChannel(guildMember.voice.channel)) {
      await Tools.handleUserError(
        message,
        "You're not in a productivity voice channel!"
      );
      return;
    }

    if (hasRole(guildMember, "Break")) {
      const breakRole = Tools.getRoleByName("Break", message.guild);
      await guildMember.roles.remove(breakRole);
      return;
    }

    if (!hasRole(guildMember, "Break")) {
      const breakRole = Tools.getRoleByName("Break", message.guild);
      await guildMember.roles.add(breakRole);
      return;
    }
  }
}
