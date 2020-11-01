import { Client, TextChannel } from "discord.js";
import { GUILD_ID, OUTPUT_CHANNEL_ID } from "../const";
import { VoiceOnDemandTools, NitroColors } from "../programs";
import { postDailyMessage } from "../programs/SendFromDB";

class Ready {
  bot: Client;

  constructor(bot: Client) {
    this.bot = bot;
    console.log(`${bot.user.tag} - Online`);
    const guild = this.bot.guilds.resolve(GUILD_ID);
    if (OUTPUT_CHANNEL_ID) {
      const outputChannel = <TextChannel>(
        guild.channels.resolve(OUTPUT_CHANNEL_ID)
      );
      outputChannel.send(`${bot.user.tag} - Online`);
    }

    NitroColors.cacheNitroColors(GUILD_ID);
    VoiceOnDemandTools.voiceOnDemandReady(bot);
    initDailyChallenge(this.bot);
  }
}

export const initDailyChallenge = async (discordClient: Client) => {
  let now = new Date();
  let firstRun = new Date();
  firstRun.setUTCHours(8, 0, 0, 0);
  if (now.getUTCHours() >= 8) {
    // schedule for the next day
    firstRun.setUTCDate(firstRun.getUTCDate() + 1);
  }
  let timeDiff = firstRun.getTime() - Date.now();

  setTimeout(
    (discordClient: Client) => {
      postDailyMessage(discordClient);
      // Set an interval for each next day
      setInterval(
        (discordClient) => {
          postDailyMessage(discordClient);
      },
        86400000, //24h
        discordClient
      );
    },
    timeDiff,
    discordClient
  );
};

export default Ready;
