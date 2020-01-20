import Discord, { TextChannel } from 'discord.js';
import Tools from '../common/tools';
import { MODERATOR_ROLE_NAME, DEADCHAT_TIME } from '../const';


export default async function Deadchat(pMessage: Discord.Message) {

    const isDead = ((Date.now() - await (await pMessage.channel.messages.fetch({ limit: 2 })).array()[1].createdTimestamp) > DEADCHAT_TIME) || pMessage.guild.name != "Yes Theory Fam";
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
    const question = deadchatQuestions[0];
    pMessage.channel.send(question);
    if(pMessage.guild.name == "Yes Theory Fam") {
        let usedDeadchatQuestions = await Tools.resolveFile("usedDeadchatQuestions");
        deadchatQuestions.splice(0, 1);
        usedDeadchatQuestions.push(question)
        Tools.writeFile("usedDeadchatQuestions", deadchatQuestions)
        Tools.writeFile("deadchatQuestions", usedDeadchatQuestions)
    } 
    


}

