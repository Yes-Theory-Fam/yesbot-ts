import Discord from 'discord.js';
import bot from "../index"

class Ready {


    bot: Discord.Client;

    constructor() {
        this.bot = bot;
        
        console.log(`${bot.user.tag} - Online`)
    }



}

export default Ready;