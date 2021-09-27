import { Client, GuildChannel, Message, TextChannel } from "discord.js";
import { GameHub, Spyfall } from "../games";
import Tools from "../common/tools";
import {
  Command,
  CommandHandler,
  DiscordEvent,
  EventLocation,
} from "../event-distribution";

const hub = new GameHub();

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

@Command({
  event: DiscordEvent.MESSAGE,
  trigger: "!game",
  channelNames: ["bot-games"],
  description: "This",
})
class ShowGameEmbed implements CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message): Promise<void> {
    const embedMessage = await message.reply(hub.buildEmbed(message.author.id));
    const emojis = hub.getEmojis();

    const selection = await Tools.addVote(
      embedMessage,
      emojis,
      [message.author.id],
      true
    );

    await embedMessage.delete();

    const emoji = selection.emoji.name;
    try {
      await hub.createSession(emoji, message.author.id);
      await message.delete();
    } catch (e) {
      if (e instanceof Error) {
        await Tools.handleUserError(message, e.message);
      }
    }
  }
}

@Command({
  event: DiscordEvent.MESSAGE,
  location: EventLocation.ANYWHERE,
  description: "This",
})
class HandleGameInput implements CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message): Promise<void> {
    if (message.channel.type == "dm") {
      hub.routeMessage(message);
      return;
    }

    const entertainmentChannel = (message.channel as GuildChannel).parent.name
      .toLocaleLowerCase()
      .endsWith("entertainment");
    if (entertainmentChannel) hub.routeMessage(message);
  }
}
