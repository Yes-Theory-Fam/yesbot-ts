import { Client, TextChannel } from "discord.js";
import { GUILD_ID, OUTPUT_CHANNEL_ID } from "../const";
import { createYesBotLogger } from "../log";
import {
  DailyChallenge,
  Game,
  NitroColors,
  Unassigned,
  VoiceOnDemandTools,
} from "../programs";

const logger = createYesBotLogger("events", "Ready");

class Ready {
  bot: Client;

  constructor(bot: Client) {
    this.bot = bot;
    logger.info(`Bot is online - ${bot.user.tag}`);

    this.init(bot);
  }

  async init(bot: Client) {
    logger.debug("Finding guild based on GUILD_ID", { GUILD_ID });
    const guild = this.bot.guilds.resolve(GUILD_ID);
    if (OUTPUT_CHANNEL_ID) {
      const outputChannel = <TextChannel>(
        guild.channels.resolve(OUTPUT_CHANNEL_ID)
      );
      const readyMessageString = (status: string) =>
        `${bot.user.tag} - Online - ${status} - ${Unassigned.getStatus(
          "Currently"
        )}`;

      await NitroColors.cacheNitroColors(GUILD_ID);
      await VoiceOnDemandTools.voiceOnDemandReady(bot);
      await DailyChallenge.initialize(this.bot);
      Game.initGameHub(guild);
      const readyMessage = await outputChannel?.send(
        readyMessageString("Fetching members.")
      );

      await guild.members.fetch({
        withPresences: true,
      });
      readyMessage.edit(readyMessageString("Members fetched, fully ready!"));
    }
  }
}

export default Ready;
