import Discord from 'discord.js';
import Tools from '../common/tools';


export default async function ReactRole(pMessage: Discord.Message) {

    //! This comes to us in the format of "!roles [add|list] [messageId] [emoji] [roleId] [channelId]"
    //! So first we need to establish if it is add or list
    const args = Tools.getArgs(pMessage.content)
    const action = args[1]
    const messageId = args[2]
    const emoji = args[3]
    const channelId = args[4]
    const [ message, channel] = await Tools.getMessageById(messageId, pMessage.guild, <Discord.TextChannel>pMessage.channel)
    pMessage.reply(channel)
}