import  Discord, { TextChannel } from 'discord.js';
import { Someone, ReactRole, StateRoleFinder, Ticket, Deadchat, WhereAreYouFromManager, GroupManager, InitialiseTestEnvironment } from '../programs/';
import bot from "../index"
import Unassigned from '../programs/Unassigned';

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
        console.log(this.message.cleanContent);
        
        let words = this.message.content.split(" ")
        if(this.message.content === "create") InitialiseTestEnvironment(this.bot);
        let channel = <Discord.TextChannel>this.message.channel;
        if(channel.name == "where-are-you-from") {
            WhereAreYouFromManager(this.message)
        }
        if(words.includes("@someone")) {
            const commandIndex = this.message.content.indexOf("@")
                Someone(this.message, commandIndex);
        }
        if(words.includes("@group")) {
            const commandIndex = this.message.content.indexOf("@")
                GroupManager(this.message, commandIndex);
        }
        if (this.message.content.startsWith("!roles")) ReactRole(this.message);
        if (this.message.content.startsWith("!group")) GroupManager(this.message, 0);
        if (this.message.content.startsWith("!state")) StateRoleFinder(this.message);
        if (this.message.content.startsWith("!fiyesta")) Ticket(this.message, "fiyesta");
        if (this.message.content.startsWith("!shoutout")) Ticket(this.message, "shoutout");
        if (this.message.content.startsWith("!deadchat")) Deadchat(this.message);
        if (this.message.content.startsWith("!unassigned")) Unassigned(this.message);
        if (this.message.content == "F") this.message.react("🇫");
        if (this.message.content.toLowerCase() == "i love u yesbot" || this.message.content.toLowerCase() == "i love you yesbot" || this.message.content.toLowerCase() == "yesbot i love you ") {
            this.message.reply("I love you too! (Although I'm not entirely sure what love is but this experience I'm feeling is probably some iteration of love.)")
            this.message.react("😍");
        }
        if (this.message.content.toLowerCase().startsWith("yesbot") && this.message.content.toLowerCase().endsWith('?')) {
            let replies = ["yes.", "probably.", "doubtful.", "i'm afraid I don't know that one", "absolutely not.", "not a chance.", "definitely.", "very very very unlikely"];
            this.message.reply(replies[Math.floor(Math.random()*replies.length)])
        }
        if (this.message.content == "!resources") {
            this.channelSpecificMessage(`

            Our own lovely Michel has written a guide tailored for this group that in his own words "gives you a good guess of what awaits you". You can find that here: https://gist.github.com/geisterfurz007/473abe140d3504bc018255597201431e

            Our group suggest Javascript as the first language whose rabbit hole you can fall down at the start of your journey. You can read more about Javascript here:
                         - CodeCademy online course: <https://www.codecademy.com/learn/javascript>
                         - Eloquent Javascript, free book: <http://eloquentjavascript.net/>
                         - MDN's JavaScript guide: <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Introduction>
                         - You Don't Know JS (free book series): <https://github.com/getify/You-Dont-Know-JS>
                         - Javascript reference/docs: <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference>
            `, "coding");
        }
        else {
            let discordChannel = this.message.channel as Discord.TextChannel;
            if(discordChannel.name === 'polls' || discordChannel.name === 'elections') {
                this.message.react('🇦').then(() => {
                    this.message.react('🅱️');
                })
            }
            if(discordChannel.name === 'feature-requests' || discordChannel.name === 'quit-moaning') {
                this.message.react('👍').then(() => {
                    this.message.react('👎');
                })
            }
        }
    }


    channelSpecificMessage(body:string, plainChannelName:string) {
        let discordChannel = this.message.channel as Discord.TextChannel;
        if(plainChannelName === discordChannel.name) {
            this.message.channel.send(body)
        }
    }


}
export default Message;