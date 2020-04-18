import Discord, { Snowflake, TextChannel, GuildMember, Message, MessageEmbed, MessageReaction, User } from 'discord.js';
import Tools from '../common/tools';
import { MODERATOR_ROLE_NAME, ENGINEER_ROLE_NAME } from '../const';
import { group } from 'console';
import { isAuthorModerator } from '../common/moderator';

interface DiscordGroup {
    name: String,
    members: String[],
    description: String,
}


export default async function GroupManager(message: Discord.Message, isConfig: boolean) {

    const content = message.content
    
    if (isConfig) {

        const words = Tools.stringToWords(content)
        words.shift();
        const [action, requestName, ...descriptionWords] = words
        const description = descriptionWords.join(" ");

        if (!action || !(["join", "create", "leave", "search", "delete"].includes(action))) {

            const helpMessage = `Incorrect syntax, please use the following: \`!group join|leave|create|search|delete\`. If you need additional help, react with 🛠️ below to tag a ${ENGINEER_ROLE_NAME}`
            const angryMessage = await message.reply(helpMessage)
            return;
        }

        const groups = await <DiscordGroup[]><unknown>Tools.resolveFile("groupManager");
        const user = message.member;
        const moderator = isAuthorModerator(message)

        switch (action) {

            case "join":
                joinGroup(message, groups, requestName, user);
                break;

            case "create":
                if(moderator) createGroup(message, groups, requestName, user, description);
                else message.reply("You do not have permission to use this command.")
                break;

            case "leave":
                leaveGroup(message, groups, requestName, user);
                break;

            case "search":
                searchGroup(message, groups, requestName);
                break;

            case "delete":
                if(moderator) deleteGroup(message, groups, requestName);
                else message.reply("You do not have permission to use this command.")
                break;

        }

    }

    else {

        const args = <string[]>content.split(" ");
        args.shift();
        const [requestName] = args
        let foundGroup = false;
        const groups = await Tools.resolveFile("groupManager");
        groups.forEach((group: any) => {

            if (group.name.toLowerCase() == requestName.toLowerCase()) {
                foundGroup = true;
                let writeLine: string = "**@" + group.name + "**:"
                group.members.forEach((member: string) => {
                    writeLine = writeLine.concat(" <@" + member + ">,")
                });
                message.channel.send(writeLine)
            }
        })

        if (!foundGroup) {
            message.reply("I couldn't find that group.")
        }
    }



}

const deleteGroup = (message:Discord.Message, groups: DiscordGroup[], requestedGroupName: string = "") => {

    if (!requestedGroupName) {
        message.react("👎")
        return;
    }
    let exists = false;

    groups.forEach((group: DiscordGroup) => {
        if (group.name.toLowerCase() == requestedGroupName.toLowerCase()) {
            group.members.forEach(async (member) => {
                let localUserData = await Tools.getUserData(<string>member)
                localUserData.groups.splice(localUserData.groups.indexOf(<string>group.name), 1)
                Tools.updateUserData(localUserData)
            })

            groups.splice(groups.indexOf(group), 1)
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


const searchGroup = (message:Discord.Message, groups: DiscordGroup[], requestedGroupName: string = "") => {
    const groupsPerPage = 4;
    const pages: Array<MessageEmbed> = [];
    groups = orderGroupsBy(groups)

    const groupFilter = ({ name }: DiscordGroup) => name.toLowerCase().includes(requestedGroupName.toLowerCase());
    const byMemberCount = (a: DiscordGroup, b: DiscordGroup) => b.members.length - a.members.length;
    const copy = Array.from(groups.filter(groupFilter)).sort(byMemberCount);
    const pageAmount = Math.ceil(copy.length / groupsPerPage);

    for (let i = 0; i < pageAmount; i++) {
        const embed = new MessageEmbed({})
            .setAuthor("YesBot", "https://cdn.discordapp.com/avatars/614101602046836776/61d02233797a400bc0e360098e3fe9cb.png?size=$%7BrequestedImageSize%7D");
        embed.setDescription(`Results for group "${requestedGroupName}" (Page ${i + 1} / ${pageAmount})`);

        const chunk = copy.splice(0, groupsPerPage);

        chunk.forEach((group) => {
            embed.addField("Group Name:", group.name, true);
            embed.addField("Number of Members:", group.members.length, true);
            embed.addField("Description", group.description || "-");
            embed.addField("\u200B", "\u200B");
        });

        pages.push(embed);
    }

    const flip = async (page: number, shownPageMessage: Message, reaction: MessageReaction) => {
        if (page < 0) page = 0;
        if (page >= pages.length) page = pages.length - 1;

        await shownPageMessage.edit(message.author.toString(), { embed: pages[page] });
        await reaction.users.remove(message.author.id);
        setupPaging(page, shownPageMessage);
    }

    const setupPaging = async (currentPage: number, pagedMessage: Message) => {
        const filter = (reaction: MessageReaction, user: User) => {
            return ["⬅️", "➡️"].includes(reaction.emoji.name) && user.id === message.author.id;
        }

        try {
            const reactions = await pagedMessage.awaitReactions(filter, { max: 1, time: 60000, errors: ['time'] });
            const first = reactions.first();
            if (first.emoji.name === "⬅️") {
                flip(currentPage - 1, pagedMessage, first);
            }
            if (first.emoji.name === "➡️") {
                flip(currentPage + 1, pagedMessage, first);
            }
        } catch (error) {
            if (error !== 'time')
                console.log(JSON.stringify(error));
            else
                console.log("Knew it...");
        }
    }

    const sentMessagePromise = message.channel.send(message.author.toString(), pages[0]);
    if (pages.length > 1) {
        sentMessagePromise.then(async msg => {
            await msg.react("⬅️");
            await msg.react("➡️");
            return msg;
        })
            .then((msg) => setupPaging(0, msg));
    }
}

const orderGroupsBy = (object: Array<DiscordGroup>): DiscordGroup[] => {
    return object;
}

const createGroup = async (message:Discord.Message, groups: DiscordGroup[], requestedGroupName: string, member: GuildMember, description: String) => {
    if (!requestedGroupName) {
        message.react("👎")
        return;
    }
    let localUserData = await Tools.getUserData(member.user.id)
    let exists = false;

    groups.forEach((group: any) => {
        if (group.name.toLowerCase() == requestedGroupName.toLowerCase()) {
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
            ],
            "description": description
        })

        Tools.writeFile("groupManager", groups);
        message.react("👍")
    }
}

const joinGroup = async (message:Discord.Message, groups: DiscordGroup[], requestedGroupName: string, member: GuildMember) => {
    let foundGroup = false;
    let localUserData = await Tools.getUserData(member.user.id)

    groups.forEach((group: DiscordGroup) => {
        if (group.name.toLowerCase() === requestedGroupName.toLowerCase()) {
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

const leaveGroup = async (message:Discord.Message, groups: DiscordGroup[], requestedGroupName: string, member: GuildMember) => {
    let localUserData = await Tools.getUserData(member.user.id)
    let success: boolean = false;
    groups.forEach((group: DiscordGroup) => {
        if (group.name.toLowerCase() === requestedGroupName.toLowerCase()) {
            localUserData.groups.splice(localUserData.groups.indexOf(<string>group.name), 1)
            Tools.updateUserData(localUserData)
            const groupPosition = group.members.indexOf(member.id)

            if (groupPosition > -1) {


                group.members.splice(groupPosition, 1)


                Tools.writeFile("groupManager", groups)
                success = true;
            }
        }
    })
    message.react(success ? "👍" : "👎");
    if (!success) message.reply("You are not in that group!")
}


