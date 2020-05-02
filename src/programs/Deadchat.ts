import Discord, { TextChannel } from 'discord.js';
import Tools from '../common/tools';
import { DeadchatQuestion, DeadchatRepository } from '../entities/Deadchat';

export default async function Deadchat(pMessage: Discord.Message) {

    const isDead = (Date.now() - (await pMessage.channel.messages.fetch({ limit: 2 })).array()[1].createdTimestamp) > 1800000; //|| pMessage.guild.name != "Yes Theory Fam";
    const isChat = ["chat", "chat-too"].includes((pMessage.channel as TextChannel).name)
    if (!isChat) {
        pMessage.delete();
        pMessage.reply("you can't use this command here.").then(message => {
            setTimeout(() => {
                message.delete()
            }, 10000);
        })
        return;
    }

    if (!isDead) {
        pMessage.delete();
        pMessage.reply("Chat is not dead! You can use this command if there have been no messages in the last 30 minutes.").then(m => {
            setTimeout(() => {
                m.delete()
            }, 10000);
        })
        return;
    }

    const deadchatRepo = await DeadchatRepository();
    const question: DeadchatQuestion = await deadchatRepo
        .createQueryBuilder()
        .select()
        .limit(1)
        .andWhere("is_used = false")
        .andWhere("random() < 0.5") // To get a random-ish question (strongly biased towards the top few questions but good enough I guess)
        .getOne();

    pMessage.channel.send(question.question);
    question.isUsed = true;
    deadchatRepo.save(question);
}