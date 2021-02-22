import { Client, TextChannel } from "discord.js";
import { GUILD_ID, OUTPUT_CHANNEL_ID } from "../const";
import { VoiceOnDemandTools, NitroColors, DailyChallenge } from "../programs";

class Ready {
  bot: Client;

  constructor(bot: Client) {
    this.bot = bot;
    console.log(`${bot.user.tag} - Online`);

    NitroColors.cacheNitroColors(GUILD_ID);
    VoiceOnDemandTools.voiceOnDemandReady(bot);
    this.init(bot);
  }

  async init(bot: Client) {
    const guild = this.bot.guilds.resolve(GUILD_ID);
    if (OUTPUT_CHANNEL_ID) {
      const outputChannel = <TextChannel>(
        guild.channels.resolve(OUTPUT_CHANNEL_ID)
      );
      const readyMessageString = (status: string) =>
        `${bot.user.tag} - Online - ${status}`;

      await NitroColors.cacheNitroColors(GUILD_ID);
      await VoiceOnDemandTools.voiceOnDemandReady(bot);
      await DailyChallenge.initialize(this.bot);
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
