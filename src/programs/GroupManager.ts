import Discord, { Snowflake, TextChannel, GuildMember, Message, MessageEmbed } from 'discord.js';
import Tools from '../common/tools';
import { MODERATOR_ROLE_NAME } from '../const';

interface DiscordGroup {
    name: String,
    members: String[]
}

let message: Message;


export default async function GroupManager(pMessage: Discord.Message, commandIndex: number) {
    message = pMessage;

    const content = pMessage.content.slice(commandIndex)

    if (pMessage.cleanContent.startsWith("!group")) {

        const words = Tools.stringToWords(pMessage.cleanContent)
        words.shift();
        const [action, requestName] = words

        if (!action || !(["join", "create", "leave", "search", "delete"].includes(action))) {
            pMessage.reply(`Incorrect syntax, please use the following: \`!group join|leave|create|search|delete\``);
            return;
        }

        const groups = await <DiscordGroup[]><unknown>Tools.resolveFile("groupManager");
        const user = pMessage.member;
        const moderator = !!pMessage.member.roles.has(pMessage.guild.roles.find(r=>r.name === MODERATOR_ROLE_NAME).id);

        switch (action) {

            case "join":

                joinGroup(groups, requestName, user);
                break;

            case "create":
                if(moderator) createGroup(groups, requestName, user);
                else pMessage.reply("You do not have permission to use this command.")
                break;

            case "leave":
                leaveGroup(groups, requestName, user);
                break;

            case "search":
                searchGroup(groups, requestName);

                break;
            case "delete":
                if(moderator) deleteGroup(groups, requestName);
                else pMessage.reply("You do not have permission to use this command.")
                break;

        }

    }

    else if (content.startsWith("@")) {

        const args = <string[]>content.split(" ");
        args.shift();
        const [requestName] = args
        let foundGroup = false;
        const groups = await Tools.resolveFile("groupManager");
        groups.forEach((group: any) => {

            if (group.name.toLowerCase() == requestName) {
                foundGroup = true;
                let writeLine: string = "**@" + group.name + "**:"
                group.members.forEach((member: string) => {
                    writeLine = writeLine.concat(" <@" + member + ">,")
                });
                pMessage.channel.send(writeLine)
            }
        })

        if (!foundGroup) {
            pMessage.reply("I couldn't find that group.")
        }
    }



    }

    const deleteGroup = (groups: DiscordGroup[], requestedGroupName: string = "") => {
        if(!requestedGroupName) {
            message.react("👎")
            return;
        }
            let exists = false;
    
            groups.forEach((group: any) => {
                if (group.name == requestedGroupName) {
                    groups.splice(groups.indexOf(group))
                    exists = true;
                }
            })
    
            if (exists) {
                Tools.writeFile("groupManager", groups);
                message.react("👍")
            }
            else {
                message.react("👎")
            
            }
    }


    const searchGroup = (groups: DiscordGroup[], requestedGroupName: string = "") => {

        const searchEmbed = new MessageEmbed({
        }).setAuthor("YesBot", "https://cdn.discordapp.com/avatars/614101602046836776/61d02233797a400bc0e360098e3fe9cb.png?size=$%7BrequestedImageSize%7D")
        searchEmbed.setDescription(`Results for group "${requestedGroupName}"`)
        groups = orderGroupsBy(groups)

        groups.forEach((group: any) => {

            if (group.name.includes() == requestedGroupName) {
                searchEmbed.addField("Group Name:", group.name, true)
                searchEmbed.addField("Number of Members:", group.members.length, true)
                searchEmbed.addBlankField()
            }
        })


        message.channel.send(searchEmbed)
    }

const orderGroupsBy = (object:Array<DiscordGroup>): DiscordGroup[] => {
     return object;
}

const createGroup = async (groups: DiscordGroup[], requestedGroupName: string, member: GuildMember) => {
    if(!requestedGroupName) {
        message.react("👎")
        return;
    }
    let localUserData = await Tools.getUserData(member.user.id)
    let exists = false;
    
    groups.forEach((group: any) => {
        if (group.name == requestedGroupName) {
            message.reply("That group already exists!")
            exists = true;
        }
    })

    if (!exists) {

        localUserData.groups.push(requestedGroupName)
        Tools.updateUserData(localUserData)

        groups.push({
            "name": requestedGroupName,
            "members": [
                message.author.id
            ]
        })

        Tools.writeFile("groupManager", groups);
        message.react("👍")
    }
}

const joinGroup = async (groups: DiscordGroup[], requestedGroupName: string, member: GuildMember) => {
    let foundGroup = false;
    let localUserData = await Tools.getUserData(member.user.id)
    
    groups.forEach((group: DiscordGroup) => {
        if (group.name.toLowerCase() === requestedGroupName) {
            foundGroup = true;
            
            localUserData.groups.push(<string>group.name)
            Tools.updateUserData(localUserData)
                    if (!group.members.includes(member.id)) {
                        group.members.push(member.id)
                        Tools.writeFile("groupManager", groups)
                        message.react("👍")
                    }
                    else {
                        message.react("👎")
                        message.reply("You are already in that group!")
                    }
                }
            })
        if (!foundGroup) {
            message.reply("I couldn't find that group.")
        }
    }

const leaveGroup = async (groups: DiscordGroup[], requestedGroupName: string, member: GuildMember) => {
    let localUserData = await Tools.getUserData(member.user.id)
            let success: boolean = false;
            groups.forEach((group: DiscordGroup) => {
                if (group.name.toLowerCase() === requestedGroupName) {
                    localUserData.groups.splice(localUserData.groups.indexOf(<string>group.name))
                    Tools.updateUserData(localUserData)
                    const groupPosition = group.members.indexOf(member.id)

                    if (groupPosition > -1) {


                        group.members.splice(groupPosition)


                        Tools.writeFile("groupManager", groups)
                        success = true;
                    }
                }
            })
            message.react(success ? "👍" : "👎");
            if (!success) message.reply("You are not in that group!")
        }


