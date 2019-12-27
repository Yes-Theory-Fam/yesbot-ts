import * as Discord from 'discord.js';
import Deadchat from './deadchat';
import Tools from './tools';
import Someone from './someone'

const bot = new Discord.Client();

bot.login("NjM2MTQ3MzQyNTEyMzU3Mzk4.XgKTvQ.NlL-5LvJARtnHeYDXBBNeFbVV4s");


bot.on("ready", () => {
    console.log("success");
    
})

bot.on("message", (message) => {

    const { content } = message;

    console.log(content.search("@someone"));
    
    if(content.search("@someone") === 0) {
        someone(message, bot)
    }

    if(content.search("!deadchat") === 0) {
        deadchat(message, bot);
    }

})

const deadchat = (message: Discord.Message, bot: Discord.Client) => {
}

const someone = async (message: Discord.Message, bot: Discord.Client) => {
    const args = Tools.getArgs(message.content)
    const arg = args[1]
    console.log(arg)
    if (arg && arg != "online") message.channel.send(`Unknown argument "${arg}". Did you mean "online"?`)
    else {
        const { author } = message;
        const target = await Someone.getTarget(arg, message);
        const question = await Someone.getQuestion();
        if (target === undefined) message.reply("There were no available users to ping! This is embarrassing. How could this have happened? There's so many people on here that statistically this message should never even show up. Oh well. Congratulations, I guess. Check your dm's for an exclusive free shipping discount on too easy merch.")
        else message.channel.send(`${author}: Hey ${target}! ${question}`)
        
    }
}

