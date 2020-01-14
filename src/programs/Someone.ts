import Discord from 'discord.js';
import Tools from '../common/tools';
import axios from 'axios';
import * as fs from 'fs';

const QUESTION_LINK: string = 'https://spreadsheets.google.com/feeds/cells/1DO5yYSSQRlH1gNVT_IsDApYV25mKvDKTg6bBmVcC4gY/1/public/full?alt=json'

async function Someone(message: Discord.Message) {

    const args = Tools.getArgs(message.content)
    const arg = args[1]
    let messageSent = false;

    if (arg && arg != "online") message.channel.send(`Unknown argument "${arg}". Did you mean "online"?`)
    else {
        const { author } = message;
        const target = await getTarget(arg, message);
        const question = await getQuestion();
        if (target === undefined) message.reply("There were no available users to ping! This is embarrassing. How could this have happened? There's so many people on here that statistically this message should never even show up. Oh well. Congratulations, I guess. Check your dm's for an exclusive free shipping discount on too easy merch.")
        else message.channel.send(`${author}: Hey ${target}! ${question}`).then(() => messageSent = true)
    }

    if (messageSent) {
        updateLastMessage(message)
    }
}

async function updateLastMessage(message: Discord.Message) {

    const object = {
        "time": new Date().toString().slice(0, 15),
        "id": message.author.id
    }

    var exists = false;
    fs.readFile('./src/collections/users.json', 'utf-8', function (err, data) {
        var users = JSON.parse(data)
        users.forEach((element:any) => {
            if (element.id == object.id) {
                exists = true;
                element.time = object.time
            }
        });
        if (!exists) {
            users.push(object)
        }
        fs.writeFile('./src/collections/users.json', JSON.stringify(users), ()=>{})
    });
}

async function getTarget(arg: string, message: Discord.Message) {

    const sdRole = message.guild.roles.find("name", "Seek Discomfort");
    let target = sdRole.members.random().user;
    let targetFound = false;
    if (arg) {
        for (let count = 0; count < 100; count++) {
            if (target.presence.status !== "online") target = sdRole.members.random().user;
            else targetFound = true;
            if (targetFound) return target;
        }
    }
    else return target;
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