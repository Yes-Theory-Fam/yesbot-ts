import Discord from 'discord.js';
import axios from 'axios';


const QUESTION_LINK: string = 'https://spreadsheets.google.com/feeds/cells/1J7DlkcWzhcm9CXiWCB-dQloCqIHjVpupyvMqBPlJ7Mk/1/public/full?alt=json'
let message: Discord.Message;



export default async function PhilosophyManager(message: Discord.Message, action: string) {

    message = message;

    switch (action) {
        case "topic":
            sendTopic();
            
            break;
    
        default:
            break;
    }
}

const sendTopic = async () => {

    const response = await axios.get(QUESTION_LINK)
    let questions: string[] = [];

    response.data.feed.entry.forEach((element: any) => {
        questions.push(element.content.$t)
    });
    let date = new Date().getDate();
    date--;

    const question = questions[date];
    message.channel.send(question)
}