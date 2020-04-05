import Discord, {Snowflake, TextChannel, GuildMember, Message} from 'discord.js';
import Tools from '../common/tools';
import { MODERATOR_ROLE_NAME } from '../const';

interface DiscordGroup {
    name:String,
    members:String[]
}

let message: Message;


export default async function GroupManager(pMessage: Discord.Message, commandIndex:number) {
    message = pMessage;

    const content = pMessage.content.slice(commandIndex)

    if(pMessage.cleanContent.startsWith("!group")) {
        
        const args = <string[]>pMessage.content.split(" ");
        args.shift();
        const [action, requestName] = args

        if(!action || !(["join","create","leave","search"].includes(action))){
            pMessage.reply(`Incorrect syntax, please use the following: \`!groups join|leave|create|search\``);
            return;
        }

        const groups = await <DiscordGroup[]><unknown>Tools.resolveFile("groupManager");
        const user = pMessage.member;

        switch (action) {

            case "join":
                
                joinGroup(groups, requestName, user);
                break;

            case "create":
            
                break;

            case "leave":
                leaveGroup(groups, requestName, user);
                break;

            case "search":

                break;

        }

        if(action == "create") {
            let exists = false;
            groups.forEach((group: any) => {
                if(group.name == requestName) {
                    pMessage.reply("That group already exists!")
                    exists = true;
                }

            })
            if(!exists) {
                 groups.push({
                "name":requestName,
                "members":[
                    pMessage.author.id
                ]
            })
            Tools.writeFile("groupManager", groups);
            pMessage.react("👍")
        }
            

        }

        if(action == "leave") {
            const groups = await Tools.resolveFile("groupManager");
groups.forEach((group: any) => {
    if(group.name == requestName) {
        if(group.members.includes(pMessage.author.id)) {
            const filteredGroup = group.members.filter((value:any) => value != pMessage.author.id)
            Tools.writeFile("groupManager", filteredGroup)
            pMessage.react("👍")
        }
        else {
            pMessage.react("👎")
            pMessage.reply("You aren't in that group!")
        }
        
    }
})
}

    }
    if(pMessage.cleanContent.startsWith("!")) {
        const args = <string[]>pMessage.content.split(" ");
        args.shift();
        const [requestName] = args

        const groups = await Tools.resolveFile("groupManager");
        groups.forEach((group: any) => {
            if(group.name == requestName) {
                group.members.push(pMessage.author.id)
                Tools.writeFile("groupManager", groups)
                pMessage.reply("You were successfully added to the " + group.name +" group.")
                
            }
        })
    }
    else if(content.startsWith("@")) {
        
        const args = <string[]>content.split(" ");
        args.shift();
        const [requestName] = args
        let foundGroup = false;
        const groups = await Tools.resolveFile("groupManager");
        groups.forEach((group: any) => {
            
            if(group.name == requestName) {
                foundGroup = true;
                let writeLine: string = "**@"+group.name+"**:"
                group.members.forEach((member:string) => {
                    writeLine = writeLine.concat(" <@"+member+">,")
                });
                pMessage.channel.send(writeLine)
            }
        })

        if(!foundGroup) {
            pMessage.reply("I couldn't find that group.")
        }
    }
}

const joinGroup = async (groups:DiscordGroup[], requestedGroupName:string, member:GuildMember) => {
    groups.forEach((group: DiscordGroup) => {
        console.log(groups);
        
        if(group.name === requestedGroupName) {
            if(!group.members.includes(member.id)) {
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
}

const leaveGroup = async (groups:DiscordGroup[], requestedGroupName:string, member:GuildMember) => {
    let success: boolean = false;
    groups.forEach((group: DiscordGroup) => {
        if(group.name === requestedGroupName) {
            const groupPosition = group.members.indexOf(member.id)
            if(groupPosition > 0) {
                console.log(group);
                
                group.members.splice(groupPosition)
                console.log(groups);
                
                Tools.writeFile("groupManager", groups)
                success = true;
            }
        }
    })
    message.react(success?"👍":"👎");
    if(!success) message.reply("You are not in that group!")
}


