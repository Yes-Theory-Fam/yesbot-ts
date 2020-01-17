import Discord, {Snowflake, TextChannel} from 'discord.js';
import Tools from '../common/tools';


export default async function ReactRole(pMessage: Discord.Message) {

    //! This comes to us in the format of "!roles [add|list] [messageId] [emoji] [roleId] [channelId]"
    //! So first we need to establish if it is add or list
    const args = <string[]>pMessage.content.split(" ");
    args.shift();
    const [action, messageId, reaction, roleId, channelId] = args
    console.log([action, messageId, reaction, roleId, channelId]);
    
    console.log(channelId);
    
    switch (action) {
        case "add":
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
                .addBlankField()
                .addField('Target Message:', message.cleanContent, true)
                .addField('Target Channel:', channel, true)
                .addField('Necessary Reaction:', reaction, true)
                .addField('Reward Role:', role, true)
            pMessage.channel.send(successEmbed)
        }


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
            let role = guild.roles.find(r => r.id == i.roleId);
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