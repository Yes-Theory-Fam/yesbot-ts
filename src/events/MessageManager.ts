import  Discord, { TextChannel } from 'discord.js';
import { Someone, ReactRole, StateRoleFinder, Ticket, Deadchat, WhereAreYouFromManager, GroupManager, InitialiseTestEnvironment, Unassigned, ProfileManager, EasterEvent } from '../programs';
import bot from "../index"
import ExportManager from '../programs/ExportManager';
import {USA_IMAGE_URL, CANADA_IMAGE_URL, UK_IMAGE_URL, AUSTRALIA_IMAGE_URL, EASTER_EVENT} from '../const'
import Tools from '../common/tools';

class MessageManager {
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
        
        const words = this.message.content.split(" ")
        const firstWord = words[0];
        const channel = <Discord.TextChannel>this.message.channel;

        switch (channel.name) {

            case "where-are-you-from":
            case "welcome-chat":
                if (firstWord == "!usa") this.SendMap('usa');
                if (firstWord == "!canada") this.SendMap('canada');
                if (firstWord == "!australia") this.SendMap('australia');
                if (firstWord == "!uk") this.SendMap('uk');;
                WhereAreYouFromManager(this.message)
                if(firstWord === "!state") StateRoleFinder(this.message);
                break;

            case "chat":
            case "chat-too":
               
                if(firstWord === "@someone") Someone(this.message);
                if(firstWord === "!deadchat") Deadchat(this.message);
                if(words.includes("@group")) GroupManager(this.message, false)
                break;

            case "permanent-testing":

                if (firstWord === "!roles") ReactRole(this.message);
                if(firstWord === "!export") ExportManager(this.message);
                if(firstWord === "!unassigned") Unassigned(this.message);
                if(firstWord === "!group") GroupManager(this.message, true);
                if(firstWord === "!profile") ProfileManager(this.message, 0);
                break;

            case "bot-commands":

                if(firstWord === "!group") GroupManager(this.message, true);
                if(firstWord === "!profile") ProfileManager(this.message, 0);
                if(firstWord === "!fiyesta") Ticket(this.message, "fiyesta");
                if(firstWord === "!shoutout") Ticket(this.message, "shoutout");
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
            
            if (firstWord === "!vote") this.addVote()
            if (firstWord === "F") this.message.react("🇫");
            if (["i love u yesbot", "i love you yesbot", "yesbot i love you "].includes(this.message.content.toLowerCase())) this.sendLove();
            if (this.message.content.toLowerCase().startsWith("yesbot") && this.message.content.toLowerCase().endsWith('?')) this.randomReply();
            

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
    console.log(this.message.member);
    
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