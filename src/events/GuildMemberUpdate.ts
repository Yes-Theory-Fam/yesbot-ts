import Discord from 'discord.js';
import Tools from '../common/tools';

class GuildMemberUpdate {


    bot: Discord.Client;

    constructor(oldMember:Discord.GuildMember | Discord.PartialGuildMember, newMember:Discord.GuildMember | Discord.PartialGuildMember) {
        this.updateUserStore(oldMember, newMember);
    }

    updateUserStore(oldMember:Discord.GuildMember | Discord.PartialGuildMember, newMember:Discord.GuildMember | Discord.PartialGuildMember) {
        const users = Tools.resolveFile('userStore')
        const { id, roles, nickname, displayHexColor, displayName } = newMember;
        
    }



}

export default GuildMemberUpdate;