import Discord, { GuildMember, TextChannel, PartialGuildMember } from 'discord.js';
import bot from "../index"
import { BuddyProjectSignup } from '../programs/BuddyProject';

class MemberJoin {


    bot: Discord.Client;

    constructor(member: GuildMember | PartialGuildMember) {
        const unassignedRole = member.guild.roles.cache.find(role => role.name === "Unassigned");
        member.roles.add(unassignedRole);

        if(member.roles.cache.find(r => r.name === "Buddy Project 2020")) {
            BuddyProjectSignup(member);
        }
        this.bot = bot;
        const welcomeChannel = member.guild.channels.cache.find(c => c.name == "where-are-you-from") as TextChannel;
        let messages = [`Welcome to the Yes Theory Fam Discord Server ${member.toString()}! What's your name? If you drop where you're from into this chat, you'll be granted full access to all the different channels :heart: You can go over <#450102410262609943> while you wait. In the meantime you can go say hi to a couple of our friends in <#689589205755625641>! :grin:`,
        `Hello there ${member.toString()}! What's your name? Welcome :heart: Don't forget to tell us where you're from so someone can give you full access to the Yes Theory Fam Discord Server! In the meantime, feel free to give <#450102410262609943> a read. In the meantime you can go say hi to a couple of our friends in <#689589205755625641>! :grin:`,
        `Welcome ${member.toString()}! What's your name? You just landed in the Yes Theory Fam Discord Server :grin: Tell us where you're from so you can explore all the different channels. Until that happens, you can take a look at <#450102410262609943>. In the meantime you can go say hi to a couple of our friends in <#689589205755625641>! :heart:`,
        `Hey ${member.toString()}. What's your name? :grin: You've just joined the Yes Theory Fam Discord Server! Drop where you're from in here so you can be given access to all the channels. Don't forget to also read the <#450102410262609943>. In the meantime you can go say hi to a couple of our friends in <#689589205755625641>! :heart: `
    ]
        let message = messages[Math.floor(Math.random()*messages.length)]
        //welcomeChannel.send(message)


    }



}

export default MemberJoin; 