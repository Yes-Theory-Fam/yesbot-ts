import { Guild, Message, MessageEmbed, TextChannel } from "discord.js";
import { GameHub, Spyfall } from "../games";
import Tools from "../common/tools";

const hub = new GameHub();

export const initGameHub = (guild: Guild) => {
  const announcementChannel = guild.channels.cache.find(
    (channel) => channel.name === "bot-games"
  );
  if (!(announcementChannel instanceof TextChannel)) {
    return;
  }
  hub.channel = announcementChannel;

  hub.registerGame(Spyfall);
};

export const showGameEmbed = async (message: Message) => {
  const embed = hub.buildEmbed(message.author.id);
  const reply =
    embed instanceof MessageEmbed ? { embeds: [embed] } : { content: embed };

  const embedMessage = await message.reply(reply);
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
};

export const handleGameInput = (message: Message) => hub.routeMessage(message);
