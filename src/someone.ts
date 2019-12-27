import Discord from 'discord.js';
import Tools from './tools';
import axios from 'axios';

class Someone {

    
    static QUESTION_LINK: string = 'https://spreadsheets.google.com/feeds/cells/1DO5yYSSQRlH1gNVT_IsDApYV25mKvDKTg6bBmVcC4gY/1/public/full?alt=json'



    static async getUsers() {

    }

    static async getTarget(arg: string, message: Discord.Message) {
        const sdRole = message.guild.roles.find("name", "Seek Discomfort");
        let target = sdRole.members.random().user;
        let targetFound = false;
        if(arg) {
            for (let count = 0; count < 100; count++) {
                if (target.presence.status !== "online") target = sdRole.members.random().user;
                else targetFound = true;
                if(targetFound) return target;
            }
        }
        else return target;
    }

    static async getQuestion() {
        let entries: string[] = [];
        const response = await axios.get(this.QUESTION_LINK)
        response.data.feed.entry.forEach((element: any) => {
            entries.push(element.content.$t)
        });
        const question = entries[Math.floor(Math.random() * entries.length)];
        return question;
    }
}



export default Someone;