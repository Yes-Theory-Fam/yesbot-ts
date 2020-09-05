import Discord from "discord.js";
import { GUILD_ID, OUTPUT_CHANNEL_ID } from "../const";
import { VoiceOnDemandTools, NitroColors } from "../programs";

class Ready {
  bot: Discord.Client;

  constructor(bot: Discord.Client) {
    this.bot = bot;
    console.log(`${bot.user.tag} - Online`);
    const guild = this.bot.guilds.resolve(GUILD_ID);
    if (OUTPUT_CHANNEL_ID) {
      const outputChannel = <Discord.TextChannel>(
        guild.channels.resolve(OUTPUT_CHANNEL_ID)
      );
      outputChannel.send(`${bot.user.tag} - Online`);
    }

    NitroColors.cacheNitroColors(GUILD_ID);
    VoiceOnDemandTools.voiceOnDemandReady(bot);
  }
}

export default Ready;
