import { Client, Guild, Message, TextChannel } from "discord.js";
import { createYesBotLogger } from "../log";
import { Game, VoiceOnDemandTools } from "../programs";

const developerChannelName = "bot-development";

const logger = createYesBotLogger("events", "ready");

const readyMessageString = (bot: Client, status: string) =>
  `${bot.user.tag} - Online - ${status}`;

const ready = async (bot: Client) => {
  logger.info(`Bot is online - ${bot.user.tag}`);

  const guildId = process.env.GUILD_ID;
  logger.debug("Finding guild based on GUILD_ID", { GUILD_ID: guildId });
  const guild = bot.guilds.resolve(guildId);
  if (process.env.OUTPUT_CHANNEL_ID) {
    await VoiceOnDemandTools.voiceOnDemandReady(bot);
    Game.initGameHub(guild);

    const messages = await sendOnlineMessage(guild);

    await guild.members.fetch({
      withPresences: true,
    });

    await updateOnlineMessages(messages);
  }
};

const sendOnlineMessage = async (guild: Guild): Promise<Message[]> => {
  const bot = guild.client;

  const channels = guild.channels.cache
    .filter(
      (c): c is TextChannel =>
        c.id === process.env.OUTPUT_CHANNEL_ID ||
        c.name === developerChannelName
    )
    .values();

  const sendPromises = [...channels].map((c) =>
    c.send(readyMessageString(bot, "Fetching members."))
  );

  return Promise.all(sendPromises);
};

const updateOnlineMessages = async (messages: Message[]): Promise<void> => {
  const promises = messages.map(async (m) => {
    const bot = m.client;
    await m.edit(readyMessageString(bot, "Members fetched, fully ready!"));
  });

  await Promise.all(promises);
};

export default ready;
