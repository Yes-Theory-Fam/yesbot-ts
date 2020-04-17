import Discord, { Snowflake, TextChannel, GuildMember, Message, MessageEmbed, MessageReaction, User } from 'discord.js';
import Tools from '../common/tools';
import { MODERATOR_ROLE_NAME } from '../const';
import { group } from 'console';

interface DiscordGroup {
    name: String,
    members: String[],
    description: String,
}

let message: Message;


export default async function GroupManager(pMessage: Discord.Message, commandIndex: number) {
    message = pMessage;

    const content = pMessage.content.slice(commandIndex)

    if (pMessage.cleanContent.startsWith("!group")) {

        const words = Tools.stringToWords(pMessage.cleanContent)
        words.shift();
        const [action, requestName, ...descriptionWords] = words
        const description = descriptionWords.join(" ");

        if (!action || !(["join", "create", "leave", "search", "delete"].includes(action))) {
            pMessage.reply(`Incorrect syntax, please use the following: \`!group join|leave|create|search|delete\``);
            return;
        }

        const groups = await <DiscordGroup[]><unknown>Tools.resolveFile("groupManager");
        const user = pMessage.member;
        const moderator = !!pMessage.member.roles.has(pMessage.guild.roles.find(r => r.name === MODERATOR_ROLE_NAME).id);

        switch (action) {

            case "join":

                joinGroup(groups, requestName, user);
                break;

            case "create":
                if (moderator) createGroup(groups, requestName, user, description);
                else pMessage.reply("You do not have permission to use this command.")
                break;

            case "leave":
                leaveGroup(groups, requestName, user);
                break;

            case "search":
                searchGroup(groups, requestName);

                break;
            case "delete":
                if (moderator) deleteGroup(groups, requestName);
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


const searchGroup = (groups: DiscordGroup[], requestedGroupName: string = "") => {
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

const createGroup = async (groups: DiscordGroup[], requestedGroupName: string, member: GuildMember, description: String) => {
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

const joinGroup = async (groups: DiscordGroup[], requestedGroupName: string, member: GuildMember) => {
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

const leaveGroup = async (groups: DiscordGroup[], requestedGroupName: string, member: GuildMember) => {
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


