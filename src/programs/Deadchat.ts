import Discord, { TextChannel } from 'discord.js';
import Tools from '../common/tools';


export default async function Deadchat(pMessage: Discord.Message) {

    const isDead = ((Date.now() - await (await pMessage.channel.messages.fetch({ limit: 2 })).array()[1].createdTimestamp) > 1800000) //|| pMessage.guild.name != "Yes Theory Fam";
    const isChat = ["chat","chat-too"].includes((pMessage.channel as TextChannel).name)
    if(!isChat) {
        pMessage.delete();
        pMessage.reply("you can't use this command here.").then(message => {
            setTimeout(() => {
                message.delete()    
            }, 10000);
        })
        return;
    }

    if(!isDead) {
        pMessage.delete();
        pMessage.reply("Chat is not dead! You can use this command if there have been no messages in the last 30 minutes.").then(m => {
            setTimeout(() => {
                m.delete()
            }, 10000);
        })
        return;
    }

    let deadchatQuestions = await Tools.resolveFile("deadchatQuestions");
    const question = deadchatQuestions[Math.floor(Math.random()*deadchatQuestions.length)];
    pMessage.channel.send(question);
    // deadchatQuestions.splice(0, 1);
    // Tools.writeFile("deadchatQuestions", deadchatQuestions)



}