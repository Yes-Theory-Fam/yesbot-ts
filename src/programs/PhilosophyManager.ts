import Discord from 'discord.js';
import axios from 'axios';


const QUESTION_LINK: string = 'https://spreadsheets.google.com/feeds/cells/1wJWtBLmG5RBwVLsS1fhUEL5MdGy9kKHu7Q8-AunZDu8/1/public/full?alt=json'



export default async function PhilosophyManager(message: Discord.Message, action: string) {


    switch (action) {
        case "topic":
            sendTopic(message);
            
            break;
    
        default:
            break;
    }
}

const sendTopic = async (message: Discord.Message) => {

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