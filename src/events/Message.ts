import  Discord from 'discord.js';
import {Someone, ReactRole} from '../programs/';
import bot from "../index"

class Message {

    message: Discord.Message;
    author: Discord.User;
    bot: Discord.Client;

    constructor(msg: Discord.Message) {
        this.message = msg;
        this.author = msg.author;
        this.bot = bot;
        this.routeMessage();
    }

    routeMessage() {
        if(this.message.content.startsWith("@someone")) Someone(this.message);
        if (this.message.content.startsWith("!roles")) ReactRole(this.message);
    }


}

export default Message;