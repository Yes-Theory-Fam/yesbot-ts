import { Client, TextChannel } from "discord.js";
import {
  Command,
  DiscordEvent,
  CommandHandler,
} from "../../event-distribution";
import { GameHub, Spyfall } from "../../games";

export const hub = new GameHub();

@Command({
  event: DiscordEvent.READY,
})
class InitGameHub implements CommandHandler<DiscordEvent.READY> {
  async handle(bot: Client): Promise<void> {
    const guild = bot.guilds.resolve(process.env.GUILD_ID);
    const announcementChannel = guild.channels.cache.find(
      (channel) => channel.name === "bot-games"
    );

    if (!(announcementChannel instanceof TextChannel)) {
      return;
    }
    hub.channel = announcementChannel;

    hub.registerGame(Spyfall);
  }
}
