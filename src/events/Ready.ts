import Discord from 'discord.js';
import bot from "../index"
import { GUILD_ID, OUTPUT_CHANNEL_ID } from '../const';

class Ready {


    bot: Discord.Client;

    constructor(bot: Discord.Client) {
        this.bot = bot;
        console.log(`${bot.user.tag} - Online`)
        const guild = this.bot.guilds.resolve(GUILD_ID)
        const outputChannel = <Discord.TextChannel>guild.channels.resolve(OUTPUT_CHANNEL_ID)
        outputChannel.send(`${bot.user.tag} - Online`)
    }



}

export default Ready;