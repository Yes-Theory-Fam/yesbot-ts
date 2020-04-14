import Discord, {Snowflake, TextChannel} from 'discord.js';
import Tools from '../common/tools';
import { MODERATOR_ROLE_NAME } from '../const';


export default async function ReactRole(pMessage: Discord.Message) {

    //! This comes to us in the format of "!roles [add|list] [messageId] [emoji] [roleId] [channelId]"
    //! So first we need to establish if it is add or list
    const isSupport = pMessage.member.roles.cache.has(pMessage.guild.roles.cache.find(r => r.name == MODERATOR_ROLE_NAME).id)
    if(!isSupport) return;

    const args = <string[]>pMessage.content.split(" ");
    args.shift();
    const [action, messageId, reaction, roleId, channelId] = args
    if(!action || !(["add","list","delete"].includes(action))){
        pMessage.reply(`Incorrect syntax, please use the following: \`!roles add|list|delete\``);
        return;
    }
    switch (action) {
        case "add":
            if(!messageId || !reaction || !roleId || !channelId || !pMessage) {
                pMessage.reply(`Incorrect syntax, please use the following: \`!roles add messageId reaction roleId channelId\``);
                 return;
            }
            addReactRoleObject(messageId, reaction, roleId, channelId, pMessage);
            break;
        case "list":
            listReactRoleObjects(pMessage)
        case "delete":
            deleteReactRoleObjects(args[1], pMessage)
        default:
            break;
    }
    
    

}

async function addReactRoleObject(messageId: Snowflake, reaction: string, roleId: Snowflake, channelId: Snowflake, pMessage: Discord.Message) {
    
    if(roleId.startsWith("<")) roleId = roleId.substring(3,21)

    let [message, channel] = await Tools.getMessageById(messageId, pMessage.guild, channelId)
    let role = await Tools.getRoleById(roleId, pMessage.guild);
    message = <Discord.Message>message;
    if (message && channel) {
        const reactRoleObject = {
            messageId: message.id,
            reaction,
            roleId: role.id,
            channelId: channelId
        }
        if (Tools.updateFile('reactRoleObjects', reactRoleObject)) {
            await message.react(reaction)
            const successEmbed = new Discord.MessageEmbed()
                .setColor('#ff6063')
                .setTitle('Reaction role successfully added.')
                .addField('\u200b', '\u200b')
                .addField('Target Message:', message.cleanContent, true)
                .addField('Target Channel:', channel, true)
                .addField('Necessary Reaction:', reaction, true)
                .addField('Reward Role:', role, true)
            pMessage.channel.send(successEmbed)
        }


    }
    else {
        pMessage.reply("I couldn't find that message, please check the parameters of your \`!roles add\` and try again.")
    }
}

async function listReactRoleObjects(pMessage: Discord.Message) {
    const guild = pMessage.guild;
    const reactRoleObjects = await Tools.resolveFile("reactRoleObjects");
    const reactRoleObjectsList = new Discord.MessageEmbed()
        .setColor('#ff6063')
        .setTitle('Reaction Role List:')
    let index = 1
    let returnString = "**List of available role reactions**:\n\n";
    try {
        await Promise.all(reactRoleObjects.map(async (i: any) => {
            let role = guild.roles.cache.find(r => r.id == i.roleId);
            let [message, channel] = await Tools.getMessageById(i.messageId, guild, i.channelId)
            message = <Discord.Message>message;
            returnString += `__**${index}:**__\n**Message**: ${message.cleanContent}\n`
            returnString += `**Channel**: <#${channel}>\n`
            returnString += `**Reaction**: ${i.reaction}\n`
            returnString += `**Reward Role**: <@&${role}>\n`
            returnString += `\n`
            index++
        }));
        pMessage.channel.send(returnString);
    } catch (error) {
        pMessage.channel.send("I couldn't find any reaction roles for this server.")
    }


    
}

async function deleteReactRoleObjects(index: any, pMessage:Discord.Message) {
    let reactRoleObjects = await Tools.resolveFile("reactRoleObjects");
    const objectToRemove:any = reactRoleObjects[index-1];
    reactRoleObjects.splice(index-1,1);
    Tools.updateFile("reactRoleObjects", reactRoleObjects).then(async () => {
        let [message, channel] = await Tools.getMessageById(objectToRemove.messageId, pMessage.guild, objectToRemove.channelId)
        message = <Discord.Message>message;
        message.reactions.removeAll();
        pMessage.channel.send("Successfully removed reaction role.")
    })
}