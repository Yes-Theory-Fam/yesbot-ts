import Discord, { GuildMember, TextChannel } from 'discord.js';
import bot from "../index"

class MemberJoin {


    bot: Discord.Client;

    constructor(member: GuildMember) {
        this.bot = bot;
        const welcomeChannel = member.guild.channels.find(c => c.name == "where-are-you-from") as TextChannel;
        welcomeChannel.send(`Welcome to the Yes Theory Fam Discord Server ${member.toString()}! If you drop the place you're from into this chat, a Support will be with you in a moment to grant you full access to our community on here :hugging:`)


    }



}

export default MemberJoin;