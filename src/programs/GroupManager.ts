import Discord, { Snowflake, TextChannel, GuildMember, Message, MessageEmbed, MessageReaction, User, Guild } from 'discord.js';
import Tools from '../common/tools';
import { MODERATOR_ROLE_NAME, ENGINEER_ROLE_NAME } from '../const';
import { isAuthorModerator } from '../common/moderator';
import { UserGroup, UserGroupRepository, UserGroupMembershipRepository, GroupMember } from '../entities/UserGroup';
import { ILike } from '../lib/typeormILIKE';
import { MessageRepository, getOrCreateMessage } from '../entities/Message';
import { ChannelToggleRepository } from '../entities/ChannelToggle';

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

        if (!action || !(["join", "create", "leave", "search", "delete", "update", "toggle"].includes(action))) {


            const helpMessage = `Incorrect syntax, please use the following: \`!group join|leave|create|search|delete|update\`. If you need additional help, react with 🛠️ below to tag a ${ENGINEER_ROLE_NAME}`
            const angryMessage = await message.reply(helpMessage)
            return;
        }

        const user = message.member;
        const moderator = isAuthorModerator(message)

        switch (action) {

            case "join":
                joinGroup(message, requestName, user);
                break;

            case "toggle":
                toggleGroup(words, message);
                break;

            case "create":
                if(moderator) createGroup(message, requestName, user, description);
                else message.reply("You do not have permission to use this command.")
                break;

            case "leave":
                leaveGroup(message, requestName, user);
                break;

            case "search":
                searchGroup(message, requestName);
                break;

            case "delete":
                if(moderator) deleteGroup(message, requestName);
                else message.reply("You do not have permission to use this command.")
                break;

            case "update": {
                moderator
                ? updateGroup(message, requestName, description)
                : message.reply("You do not have permission to use this command.");
            }
        }

    }

    else {
        const groupRepository = await UserGroupRepository();

        const groupTriggerStart = content.substring(content.indexOf("@group"));
        const args = <string[]>groupTriggerStart.split(" ");
        args.shift();
        const [requestName] = args
        let foundGroup = false;
        const groups = (await groupRepository.find({
            relations: ["members"],
        }));
        groups.forEach((group: UserGroup) => {
            if (group.name.toLowerCase() == requestName.toLowerCase()) {
                foundGroup = true;
                let writeLine: string = "**@" + group.name + "**:"
                group.members.forEach((member: GroupMember) => {
                    writeLine = writeLine.concat(" <@" + member.id + ">,")
                });
                message.channel.send(writeLine)
            }
        })

        if (!foundGroup) {
            message.reply("I couldn't find that group.")
        }
    }
}


const toggleGroup = async (words:string[], message: Discord.Message) => {
    if (!isAuthorModerator(message)) {
        message.react("👎");
        return;
    }

    words.shift();
    const [ messageId, emoji, channelName ] = words;
    if(!(messageId && emoji && channelName)) {
        message.react("👎")
        message.reply("Invalid syntax, please double check for messageId, emoji, channelName and try again.")
        return;
    }
    const existingChannel = message.guild.channels.cache.find(c => c.name === channelName.toLowerCase());
    if(!existingChannel) {
        message.react("👎")
        message.reply("That channel doesn't exist here.")
        return;
    }

    const reactionMessage = await getOrCreateMessage(messageId);

    if (reactionMessage.channel === null) {
        message.reply("Since this is the first time I've heard of this message I need your help. " +
            `Can you put one ${emoji} emoji on the message for me please?\n` +
            "After you've done that, I'll make sure to put up all the emojis on it. :grin:\n" +
            "You can keep adding emojis here and add one on the original message when you're done, and I'll add them all!"
            )
    }

    const channelToggleRepository = await ChannelToggleRepository();

    try {
        const toggle = channelToggleRepository.create({
            emoji,
            message: reactionMessage,
            channel: existingChannel.id,
        });
        await channelToggleRepository.save(toggle);
        message.react("👍");
    } catch (err) {
        console.error('Failed to create toggle', err)
        message.react("👎");
        return
    }

    if (reactionMessage.channel !== null) {
        await backfillReactions(reactionMessage.id, reactionMessage.channel, message.guild);
    }
}

export async function backfillReactions(messageId: string, channelId: string, guild: Guild) {
    console.log(`backfilling reactions for message ${messageId} in ${channelId}`)
    const channelToggleRepository = await ChannelToggleRepository();

    const channel = guild.channels.cache.find(c => c.id === channelId) as TextChannel;

    if (channel === undefined) {
        throw new Error("I can't find that channel. Maybe it has been deleted?")
    }

    const reactionDiscordMessage = await channel.messages.fetch(messageId)
    const toggles = await channelToggleRepository.find({
        where: {
            message: messageId,
        }
    });

    // Only add missing reactions
    toggles
        .forEach(toggle => reactionDiscordMessage.react(toggle.emoji));
}

const deleteGroup = async (message:Discord.Message, requestedGroupName: string = "") => {

    if (!requestedGroupName) {
        message.react("👎")
        return;
    }

    const groupRepository = await UserGroupRepository();
    const group = await groupRepository.findOne({
        where: {
            name: requestedGroupName,
        },
    });

    if (group === undefined) {
        await message.reply("That group does not exist!");
        return;
    }

    await groupRepository.delete(group);
    await message.react("👍");
}


const searchGroup = async (message:Discord.Message, requestedGroupName: string = "") => {
    const groupRepository = await UserGroupRepository();

    const groupsPerPage = 4;
    const pages: Array<MessageEmbed> = [];
    const byMemberCount = (a: UserGroup, b: UserGroup) => b.members.length - a.members.length;

    const copy = (await groupRepository.find({
        where: {
            name: ILike(`%${requestedGroupName}%`),
        },
        relations: ["members"],
    })).sort(byMemberCount);

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


const createGroup = async (message:Discord.Message, requestedGroupName: string, member: GuildMember, description: string) => {
    if (!requestedGroupName) {
        message.react("👎")
        return;
    }

    const groupRepository = await UserGroupRepository();
    const group = await groupRepository.findOne({
        where: {
            name: requestedGroupName,
        }
    });

    if (group !== undefined) {
        await message.reply("That group already exists!")
        return
    }

    const newGroup = groupRepository.create({
        name: requestedGroupName,
        description,
    });

    await groupRepository.save(newGroup);
    await message.react("👍")
}

const updateGroup = async(message: Discord.Message, requestedGroupName: string, description: string) => {
    if (!requestedGroupName) {
        message.react("👎")
        return;
    }

    const groupRepository = await UserGroupRepository();
    const group = await groupRepository.findOne({
        where: {
            name: ILike(requestedGroupName),
        }
    });

    if (group === undefined) {
        await message.reply("That group doesn't exist!")
        return
    }

    const previousDescription = group.description;

    group.description = description;
    await groupRepository.save(group);

    await message.reply(`Group description updated from \n> ${previousDescription} \nto \n> ${group.description}`);
}

const joinGroup = async (message:Discord.Message, requestedGroupName: string, member: GuildMember) => {
    const groupRepository = await UserGroupRepository();
    const userGroupMembershipRepository = await UserGroupMembershipRepository();

    const newGroupMember = userGroupMembershipRepository.create({
        id: member.id,
    });

    const group = await groupRepository.findOne({
        where: {
            name: ILike(requestedGroupName),
        },
        relations: ["members"]
    });

    if (group === undefined) {
        message.reply("I couldn't find that group.")
        return
    }

    if (group.members.some((m: GroupMember) => m.id === member.id)) {
        message.react("👎")
        message.reply("You are already in that group!")
        return
    }

    const membership = await userGroupMembershipRepository.save(newGroupMember);
    groupRepository.save({
        ...group,
        members: [...group.members, membership],
    });

    message.react("👍");
}

const leaveGroup = async (message:Discord.Message, requestedGroupName: string, member: GuildMember) => {
    const groupRepository = await UserGroupRepository();

    const group = await groupRepository.findOne({
        where: {
            name: ILike(requestedGroupName),
        },
        relations: ["members"]
    });

    if (group === undefined) {
        message.reply("I couldn't find that group.")
        return
    }

    const updatedMemberList = group.members.filter((m: GroupMember) => m.id !== member.id);
    groupRepository.save({
        ...group,
        members: updatedMemberList,
    });

    const removed = updatedMemberList.length < group.members.length;

    message.react(removed ? "👍" : "👎");
    if (!removed) message.reply("You are not in that group!")
}
