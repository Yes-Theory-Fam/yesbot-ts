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

        const regionCountries = ["Australia", "Canada", "the UK", "the USA"];
        const findGeneralRole = (member: Discord.GuildMember | Discord.PartialGuildMember) => member.roles.cache.find(({name}) => {
            return regionCountries.some(country => name.endsWith(`${country}!`));
        });
        const hasSpecificRole = (member: Discord.GuildMember | Discord.PartialGuildMember) => member.roles.cache.some(({name}) => {
            return regionCountries.some(country => name.includes(`${country}! (`));
        });

        const generalRole = findGeneralRole(oldMember);
        if (generalRole && hasSpecificRole(newMember)) {
            newMember.roles.remove(generalRole);
        }
    }

}

export default GuildMemberUpdate;