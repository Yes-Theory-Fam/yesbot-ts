import Discord, { TextChannel } from 'discord.js';
import Tools from '../common/tools';
import flag from 'country-code-emoji';
import { userInfo } from 'os';

interface Country {
    name: string;
    code: string
}

export default async function WhereAreYouFromManager(pMessage: Discord.Message) {

    const hasRoles = !!pMessage.member.roles.cache.find(role => role.name.includes("I'm from"));
    const {guild, channel} = pMessage;
    const countries: Array<Object> = await Tools.resolveFile("countryRoles");
    const words: Array<string> = pMessage.cleanContent.split(" ");

    words.forEach(word => {
        countries.forEach((country: any) => {
            if (word.toLowerCase() === country.name.toLowerCase()) {
                const roleToGive = pMessage.guild.roles.cache.find(role => role.name.toLowerCase().includes(word.toLowerCase()));
                if (roleToGive) {
                    const flagReaction: string = flag(country.code)
                    if (!hasRoles) {
                        pMessage.react(flag(country.code))
                        pMessage.awaitReactions((reaction: any, user: Discord.User) => {

                        
                            return (flagReaction.includes(reaction.emoji.name) && !user.bot);
                        },{ 
                            max: 1, time: 60000000, errors: ['time'] }).then(collected => {
                                const user = pMessage.guild.members.cache.find(member => {
                                    return !!member.roles.cache.find(role => role.name == "Support")
                                });
                                if (user) pMessage.member.roles.add(roleToGive);
                            })
                    }
                }
            }
        })
    });


}