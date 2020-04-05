import Discord from 'discord.js';
import bot from "../index"

class Raw {

    event: any;
    bot: Discord.Client;
    eventType: string;

    constructor(event: any) {
        this.bot = bot;
        this.event = event;
        this.eventType = event.t;
        
        this.handleEvent()
    }

    handleEvent() {
    }


}

export default Raw;