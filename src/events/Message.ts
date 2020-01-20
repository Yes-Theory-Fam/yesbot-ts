import  Discord from 'discord.js';
import { Someone, ReactRole, StateRoleFinder, Ticket, Deadchat } from '../programs/';
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
        if (this.message.content.startsWith("!state")) StateRoleFinder(this.message);
        if (this.message.content.startsWith("!fiyesta")) Ticket(this.message, "fiyesta");
        if (this.message.content.startsWith("!shoutout")) Ticket(this.message, "shoutout");
        if (this.message.content.startsWith("!deadchat")) Deadchat(this.message);
        if (this.message.content == "F") this.message.react("🇫");
    }


}

export default Message;