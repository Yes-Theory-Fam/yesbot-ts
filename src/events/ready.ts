import { Client, TextChannel } from "discord.js";
import { createYesBotLogger } from "../log";
import {
  DailyChallenge,
  Game,
  NitroColors,
  Unassigned,
  VoiceOnDemandTools,
} from "../programs";

const logger = createYesBotLogger("events", "ready");

const ready = async (bot: Client) => {
  logger.info(`Bot is online - ${bot.user.tag}`);

  const guildId = process.env.GUILD_ID;
  logger.debug("Finding guild based on GUILD_ID", { GUILD_ID: guildId });
  const guild = bot.guilds.resolve(guildId);
  if (process.env.OUTPUT_CHANNEL_ID) {
    const outputChannel = <TextChannel>(
      guild.channels.resolve(process.env.OUTPUT_CHANNEL_ID)
    );
    const readyMessageString = (status: string) =>
      `${bot.user.tag} - Online - ${status} - ${Unassigned.getStatus(
        "Currently"
      )}`;

    await NitroColors.cacheNitroColors(guildId);
    await VoiceOnDemandTools.voiceOnDemandReady(bot);
    await DailyChallenge.initialize(bot);
    Game.initGameHub(guild);
    const readyMessage = await outputChannel?.send(
      readyMessageString("Fetching members.")
    );

    await guild.members.fetch({
      withPresences: true,
    });
    readyMessage.edit(readyMessageString("Members fetched, fully ready!"));
  }
};

export default ready;
