import Discord from 'discord.js';
import Tools from '../common/tools';
import { hasRole } from '../common/moderator';
import { BuddyProjectSignup } from '../programs/BuddyProject';

class GuildMemberUpdate {


    bot: Discord.Client;

    constructor(oldMember:Discord.GuildMember | Discord.PartialGuildMember, newMember:Discord.GuildMember | Discord.PartialGuildMember) {
        
        if(hasRole(newMember, "Buddy Project 2020") && !hasRole(oldMember, "Buddy Project 2020")) {
            BuddyProjectSignup(newMember)
        }
    }

}

export default GuildMemberUpdate;