import  Discord, { TextChannel, User } from 'discord.js';
import { Someone, ReactRole, StateRoleFinder, Ticket, Deadchat, WhereAreYouFromManager, GroupManager, InitialiseTestEnvironment, Unassigned, ProfileManager, EasterEvent } from '../programs';
import bot from "../index"
import ExportManager from '../programs/ExportManager';
import {USA_IMAGE_URL, CANADA_IMAGE_URL, UK_IMAGE_URL, AUSTRALIA_IMAGE_URL } from '../const'
import Tools from '../common/tools';
import { hasRole, textLog, getMember } from '../common/moderator';

class MessageManager {
    message: Discord.Message;
    author: Discord.User;
    bot: Discord.Client;
    logs: boolean;

    constructor(msg: Discord.Message) {
        this.message = msg;
        this.author = msg.author;
        this.bot = bot;
        if(msg.channel.type === "dm" && !msg.author.bot) {
            this.routeDm();
        }
        else {
            this.routeMessage();
        }
        
    }
    routeMessage() {

        const words = this.message.content.split(" ")
        const firstWord = words[0];
        const channel = <Discord.TextChannel>this.message.channel;

        switch (channel.name) {

            case "where-are-you-from":
            case "welcome-chat":
            case "flag-drop":
                if (firstWord == "!usa") this.SendMap('usa');
                if (firstWord == "!canada") this.SendMap('canada');
                if (firstWord == "!australia") this.SendMap('australia');
                if (firstWord == "!uk") this.SendMap('uk');
                WhereAreYouFromManager(this.message);
                if(firstWord === "!state") StateRoleFinder(this.message);
                break;

            case "chat":
            case "chat-too":
               
                if(firstWord === "@someone") Someone(this.message);
                if(firstWord === "!deadchat") Deadchat(this.message);
                if(words.includes("@group")) GroupManager(this.message, false)
                break;

            case "permanent-testing":

                if(firstWord === "!export") ExportManager(this.message);
                if(firstWord === "!unassigned") Unassigned(this.message);
                if(firstWord === "!group") GroupManager(this.message, true);
                if(firstWord === "!profile") ProfileManager(this.message, 0);
                break;

            case "bot-commands":

                if(firstWord === "!group") GroupManager(this.message, true);
                if(firstWord === "!profile") ProfileManager(this.message, 0);
                break;

            case "coding":
                if(firstWord === "!resources") this.resources("coding");
                break;

            case "polls":

                this.message.react('🇦').then(() => this.message.react('🅱️'))
                break;

            case "feature-requests":

                this.message.react('👍').then(() => this.message.react('👎'));
                break;

            case "gaming":
                if(words.includes("@group")) GroupManager(this.message, false)
                break;

            }
            if(firstWord === "!fiyesta") Ticket(this.message, "fiyesta");
            if(firstWord === "!shoutout") Ticket(this.message, "shoutout");
            if (firstWord === "!vote") this.addVote()
            if (firstWord === "!delete") hasRole(this.message.member, "Support") ? this.deleteMessages() : null;
            if (firstWord === "!role") ReactRole(this.message);
            if (firstWord === "F") this.message.react("🇫");
            if (["i love u yesbot", "i love you yesbot", "yesbot i love you "].includes(this.message.content.toLowerCase())) this.sendLove();
            if (this.message.content.toLowerCase().startsWith("yesbot") && this.message.content.toLowerCase().endsWith('?')) this.randomReply();
             

        }

        async routeDm() {
            this.message.reply("I've sent your name request to the mods, hopefully they answer soon! In the meantime, you're free to roam around the server and explore. Maybe post an introduction to get started? :grin:")
            const message = `Username: ${this.message.author.toString()} would like to rename to "${this.message.content}". Allow?`;
            const sentMessage = await textLog(message)
            sentMessage.react("✅").then(message => sentMessage.react("🚫"))
            sentMessage.awaitReactions((reaction: any, user: User) => {
                return !user.bot
            }, { max: 1, time: 6000000, errors: ['time'] })
                .then(collected => {
                    const reaction = collected.first();
                    switch (reaction.emoji.toString()) {
                        case "✅":
                            const member = getMember(this.message.author.id)
                            member.setNickname(this.message.content)
                            sentMessage.delete();
                            textLog(`${this.message.author.toString()} was renamed to ${this.message.content}.`)
                            break;
                        case "🚫":
                            sentMessage.delete();
                            textLog(`${this.message.author.toString()} was *not* renamed to ${this.message.content}.`)
                            break;
                    
                        default:
                            break;
                    }
                })
        }

    resources = (channel:string) =>{
    switch (channel) {
        case "coding":
            this.message.channel.send(`

            Our own lovely Michel has written a guide tailored for this group that in his own words "gives you a good guess of what awaits you". You can find that here: https://gist.github.com/geisterfurz007/473abe140d3504bc018255597201431e

            Our group suggest Javascript as the first language whose rabbit hole you can fall down at the start of your journey. You can read more about Javascript here:
                         - CodeCademy online course: <https://www.codecademy.com/learn/javascript>
                         - Eloquent Javascript, free book: <http://eloquentjavascript.net/>
                         - MDN's JavaScript guide: <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Introduction>
                         - You Don't Know JS (free book series): <https://github.com/getify/You-Dont-Know-JS>
                         - Javascript reference/docs: <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference>
            `)
            break;
    
        default:
            break;
    }
}

deleteMessages = async () => {
    const words = Tools.stringToWords(this.message.content)
    words.shift();
    const messagesToDelete = Number(words[0])
    if(messagesToDelete !== NaN) {
        this.message.channel.bulkDelete(messagesToDelete)
    }
    
}

addVote = async () => {
   const words = Tools.stringToWords(this.message.content)
   words.shift();
   const messageId = words[0];
   const messageToVote = await this.message.channel.messages.resolve(messageId);
   if(!messageToVote) this.message.react("👎")
   else this.message.delete().then(() => messageToVote.react("👍")).then(() => messageToVote.react("👎"));
}

randomReply() {
    let replies = ["yes.", "probably.", "doubtful.", "i'm afraid I don't know that one", "absolutely not.", "not a chance.", "definitely.", "very very very unlikely"];
    this.message.reply(replies[Math.floor(Math.random()*replies.length)])
}
sendLove() {    
    this.message.reply("I love you too! (Although I'm not entirely sure what love is but this experience I'm feeling is probably some iteration of love.)")
    this.message.react("😍");
}
SendMap(country:string) {
    this.message.delete();
    const image = new Discord.MessageAttachment(country === 'usa' ? USA_IMAGE_URL : country === 'canada' ? CANADA_IMAGE_URL : country === 'australia' ? AUSTRALIA_IMAGE_URL : UK_IMAGE_URL) 
    this.message.channel.send(image)
}
}
export default MessageManager;