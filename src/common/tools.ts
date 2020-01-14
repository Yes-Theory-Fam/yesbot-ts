import fs from 'fs';
import { resolve } from 'dns';
import Discord, { TextChannel } from 'discord.js';
class Tools {


    static getArgs(message:string) {
        const args = message.split(" ");
        return args;
    }

    static async resolveFile(filename: string) {
        fs.readFile(`./src/collections/${filename}.json`, 'utf-8', (err, data) => {
            return JSON.parse(data);
        });
    }

    static async getMessageById(id:string, guild:Discord.Guild, pChannel:TextChannel) {

        //? Return [Message, Channel]

        const channel: TextChannel = <TextChannel>guild.channels.find((c) => c.id == pChannel.id)
        return [channel.messages.find(m => m.id === id), channel]


    }
}


export default Tools;