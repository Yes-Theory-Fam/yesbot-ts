import Discord from 'discord.js';
import bot from "../index"

class Ready {


    bot: Discord.Client;

    constructor() {
        this.bot = bot;
        console.log("YesBot - Typescript is online.  ")
    }



}

export default Ready;