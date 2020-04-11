import fs, { exists } from 'fs';
import { resolve } from 'dns';
import Discord, { TextChannel, Snowflake } from 'discord.js';

interface LocalUser {
    id:string,
    groups:string[]
}
class Tools {

    wheels = 4;

    static getArgs(message:string) {
        const args = message.split(" ");
        return args;
    }

    static stringToWords(inputStr:string): Array<string> {
        return <string[]>inputStr.split(" ");
    }

    static async resolveFile(filename: string): Promise<Object[]> {
        
        return new Promise((resolve, reject) =>{
            try {
                fs.readFile(`./src/collections/${filename}.json`, 'utf-8', (err, data) => {
                    console.log(filename)
                    resolve(JSON.parse(data))
            });
            } catch (error) {
                const reason = "FAILED TO READ FILE " + `./src/collections/${filename}.json`
                reject(reason)
            }

        })
    }

    static async getUserData(id:string): Promise<LocalUser> {
        const users:LocalUser[] = await <LocalUser[]><unknown>this.resolveFile("userStore")
        const localUser = users.find(user => user.id === id);
        if(!localUser) {
            users.push({"id":id,"groups":[]})
            await this.writeFile("userStore", users)
            return {"id":id,"groups":[]}
        }
        return localUser
    }

    static async updateUserData(user:LocalUser) {
        let users:LocalUser[] = await <LocalUser[]><unknown>this.resolveFile("userStore")
        users.forEach((storedUser, index, array) => {
            if(user.id === storedUser.id) {
                array[index] = user
            }
        })
        
        
        await this.writeFile("userStore", users)
    }

    static async writeFile(filename: string, data:any) {
        fs.writeFile(`./src/collections/${filename}.json`, JSON.stringify(data), () => {
            return true;
        });
    }

    static async updateFile(filename:string, data:any) {
        fs.readFile(`./src/collections/${filename}.json`, 'utf-8', (err, string) => {
            let existingArray = JSON.parse(string);

            
            existingArray.push(data)
            
            fs.writeFile(`./src/collections/${filename}.json`, JSON.stringify(existingArray), () => {
                return true;
            });
        });
    }

    static censor(key:any, value:any) {
        if (value && typeof value === "object" && value.parent) {
            value.parent = value.parent.name;
        }
        return value;
    }

    static async getMessageById(messageId:Snowflake, guild:Discord.Guild, channelId:string) {

        //? Return [Message, Channel]
        try {
            const channel: TextChannel = <TextChannel>guild.channels.find((c) => c.id == channelId)
            const message = await channel.messages.fetch(messageId)
            return [message, channel]
        } catch (error) {
            return [null,null]
        }



    }

    static async getRoleById(roleId: Snowflake, guild:Discord.Guild) {
        return guild.roles.find((r) => r.id == roleId)
    }
}





export default Tools;