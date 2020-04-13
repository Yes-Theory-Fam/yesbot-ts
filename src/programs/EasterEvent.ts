import Discord, { TextChannel, User, Channel } from 'discord.js';
import Tools from '../common/tools';
import { EASTER_EVENT } from '../const';

const EGG_DELAY_SECONDS = 1200;

let eggcount = 0;
let totalCount = 25;


export default async function EasterEvent(msg: Discord.Message) {
    const sendEgg = async () => {

        const enabledChannels = ["chat", "chat-too", "welcome-chat", "traveling-together", "look-at-my-stuff", "social-media", "recommendations", "music", "visual-design", "photography", "filmmaking", "literature", "food", "board-games", "sports", "fitness", "beauty-and-fashion", "pets", "coding"]

        const channelArray: Channel[] = []

        enabledChannels.forEach(channelName => {
            channelArray.push(msg.guild.channels.find(c => c.name === channelName))
        })

        const randomChannel = <TextChannel>channelArray[Math.floor(Math.random() * enabledChannels.length)]
        const randomMessage = await randomChannel.send(getEggMessage());
        const modChat = <TextChannel>msg.guild.channels.find(c => c.name === "moderation")
        const eventChat = <TextChannel>msg.guild.channels.find(c => c.name === "easter-epidemic")
        const modRole = msg.guild.roles.find(r => r.name === "Support")

        let messageAlive = true;
        randomMessage.react("🥚")
        randomMessage.awaitReactions(isBot,{max: 1, time: 6000000, errors: ['time']}).then(collected => {
            eggcount++
            totalCount++
            messageAlive = false;
            randomMessage.delete();
            const reaction = collected.first();
            const member = collected.first().users.array()[1];
            switch (reaction.emoji.toString()) {
                case "🥚":
                    eventChat.send(`<@${member}> found an egg! Only ${5-eggcount} left to unlock the next emote!`)
                    if(eggcount == 5) {
                        modChat.send(`${modRole.toString()} 5 further emotes have been found. Please add the next emoji.`)
                        eventChat.send(`Congratulations! ${totalCount} eggs have been found, which means there's a new emote unlocked! Go find it!`)
                        eggcount = 0;
                    }
                }
            })
            setTimeout(() => {
                if(messageAlive) {
                    randomMessage.delete();
                    eventChat.send(`An egg was left out for too long! Better try harder next time!`)
                } 
            }, 3000)
        

    }

(function loop() {
    var rand = Math.round(Math.random() * EGG_DELAY_SECONDS * 1000);
    setTimeout(() =>{
            if(EASTER_EVENT) sendEgg();
            loop();  
    }, rand);
}());
    
    // 
    

        }

const isBot = (reaction: any, user: User) => {
    return !user.bot
}

const getEggMessage = () => {
    const messages = [`Easter bunny has been seen\nStay inside it's quarantine`,`Chocolate egg, my favourite piece\nCan't come out it's allergies`,`These egg hunts are super fun\nWe're in lockdown, I can't run`,`I get sad when Easter ends\nYet happy discord gives me 6000 friends`,`Jesus, he got resurrected\nWash your hands, don't get infected`];
    return messages[Math.floor(Math.random()*messages.length)]
}
        


