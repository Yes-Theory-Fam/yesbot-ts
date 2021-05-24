import { Client, TextChannel } from "discord.js";
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
  client: Client;

  constructor(client: Client) {
    this.client = client;
    logger.info(`Bot is online - ${client.user.tag}`);

    this.init(client);
  }

  async init(bot: Client) {
    const GUILD_ID = process.env.GUILD_ID;
    logger.debug("Finding guild based on GUILD_ID", { GUILD_ID });
    const guild = this.client.guilds.resolve(GUILD_ID);
    if (process.env.OUTPUT_CHANNEL_ID) {
      const outputChannel = <TextChannel>(
        guild.channels.resolve(process.env.OUTPUT_CHANNEL_ID)
      );
      const readyMessageString = (status: string) =>
        `${bot.user.tag} - Online - ${status} - ${Unassigned.getStatus(
          "Currently"
        )}`;

      await NitroColors.cacheNitroColors(GUILD_ID);
      await VoiceOnDemandTools.voiceOnDemandReady(bot);
      await DailyChallenge.initialize(this.client);
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
