import Discord from 'discord.js';
import Tools from '../common/tools';
import axios from 'axios';
import * as fs from 'fs';

const QUESTION_LINK: string = 'https://spreadsheets.google.com/feeds/cells/1DO5yYSSQRlH1gNVT_IsDApYV25mKvDKTg6bBmVcC4gY/1/public/full?alt=json'

async function Someone(message: Discord.Message) {

    const allow = await isAllowed(message.author);
    if (!allow) {
        message.reply("you have already used this command today!")
        return;
    }

    const hasSeekDiscomfort = message.member.roles.has(message.guild.roles.find(r => r.name == "Seek Discomfort").id);
    if(!hasSeekDiscomfort) {
        message.reply("You need the Seek Discomfort role for that! You can get one by writing a detailed bio of yourself in introductions.")
        return;
    }
    const args = Tools.getArgs(message.content)
    const arg = args[1]

    if (arg && arg != "online") message.channel.send(`Unknown argument "${arg}". Did you mean "online"?`)
    else {
        const { author } = message;
        const target = await getTarget(arg, message);
        const question = await getQuestion();
        if (target === undefined) message.reply("There were no available users to ping! This is embarrassing. How could this have happened? There's so many people on here that statistically this message should never even show up. Oh well. Congratulations, I guess. Check your dm's for an exclusive free shipping discount on too easy merch.")
        else message.channel.send(`${author.toString()}: Hey ${target.toString()}! ${question}`).then((sentMsg) => updateLastMessage(message))
    }
}

async function updateLastMessage(message: Discord.Message) {

    const object = {
        "time": new Date().toString().slice(0, 15),
        "id": message.author.id
    }
    let someoneUsers = await Tools.resolveFile("someoneUsers");
    someoneUsers = someoneUsers || [];
    const thisUser:any = someoneUsers.find((u:any) => u.id == object.id);
    if(thisUser) thisUser.time = object.time;
    else someoneUsers.push(object);
    await Tools.writeFile("someoneUsers", someoneUsers);
    return true;
}

async function isAllowed(user:Discord.User) {
    let someoneUsers = await Tools.resolveFile("someoneUsers");
    
    
    const thisUser: any = someoneUsers.find((u: any) => u.id == user.id);
    if (thisUser && thisUser.time == new Date().toString().slice(0, 15)) return false;
    else return true;
}

async function getTarget(arg: string, message: Discord.Message) {
    if(message) {
        const sdRole = message.guild.roles.find(r => r.name == "Seek Discomfort");
        if(!sdRole) {
            message.channel.send("There is no Seek Discomfort role in this server!");
            return;
        }
        let target = sdRole.members.random().user;
        let targetFound = false;
        if (arg) {
            for (let count = 0; count < 100; count++) {
                if (target.presence.status !== "online" || target.id == message.author.id) target = sdRole.members.random().user;
                else targetFound = true;
                if (targetFound) return target;
            }
        }
        else return target;
    }

}

async function getQuestion() {
    let entries: string[] = [];
    const response = await axios.get(QUESTION_LINK)
    response.data.feed.entry.forEach((element: any) => {
        entries.push(element.content.$t)
    });
    const question = entries[Math.floor(Math.random() * entries.length)];
    return question;
}



export default Someone;