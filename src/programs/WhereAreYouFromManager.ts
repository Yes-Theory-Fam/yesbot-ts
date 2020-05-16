import Discord, { TextChannel } from 'discord.js';
import Tools from '../common/tools';
import {isRegistered, textLog} from '../common/moderator';
import { Country, countries } from "../collections/flagEmojis";
import { MODERATOR_ROLE_NAME } from '../const';


export default async function WhereAreYouFromManager(pMessage: Discord.Message) {

    const newUser = !isRegistered(pMessage.member);

    if(newUser) {
        const matchedCountries = countries.filter((country:Country) => {
            return pMessage.content.includes(country.emoji) || pMessage.content.toLowerCase().includes(country.name.toLowerCase())
        });
        const uniqueMatches = matchedCountries.filter(({name: filterName}, index, self) => self.findIndex(({name}) => name === filterName) === index);

        if(uniqueMatches.length > 1) {
            pMessage.reply("Please only tell me 1 country for now, you can ask a member of the Support team about multiple nationalities :grin:")
            return;
        }

        const countryToAssign = uniqueMatches[0];
        if(countryToAssign) {

            const isOutlier = ["Australia", "United States", "United Kingdom", "Canada"].find(each => countryToAssign.title.includes(each));
            let roleToAssign: Discord.Role;

            switch (isOutlier) {
                case "Australia":
                    roleToAssign = pMessage.guild.roles.cache.find(role => role.name === "I'm from Australia!");
                    break;
                case "United Kingdom":
                    roleToAssign = pMessage.guild.roles.cache.find(role => role.name === "I'm from the UK!");
                    break;
                case "United States":
                    roleToAssign = pMessage.guild.roles.cache.find(role => role.name === "I'm from the USA!");
                    break;
                case "Canada":
                    roleToAssign = pMessage.guild.roles.cache.find(role => role.name === "I'm from Canada!");
                    break;
                default:
                    roleToAssign = pMessage.guild.roles.cache.find(role => role.name.includes("I'm from") && role.name.toLowerCase().includes(countryToAssign.name.toLowerCase()));
                    break;
            }

            if(!roleToAssign) {
                const moderatorRole = pMessage.guild.roles.cache.find(r => r.name === MODERATOR_ROLE_NAME)
                textLog(`${moderatorRole.toString()}: <@${pMessage.author.id}> just requested role for country ${countryToAssign.name}, but I could not find it. Please make sure this role exists.`);
                return;
            }
            pMessage.member.roles.add(roleToAssign);
            const unassignedRole = pMessage.member.guild.roles.cache.find(role => role.name === "Unassigned");
            pMessage.member.roles.remove(unassignedRole);
            pMessage.react("👍")
            pMessage.member.createDM().then(dmChannel => {
                const rules = pMessage.guild.channels.cache.find(c => c.name === "rules");
                const generalInfo = pMessage.guild.channels.cache.find(c => c.name === "general-info")
                dmChannel.send(`Hey! My name is YesBot, I'm so happy to see you've made it into our world, we really hope you stick around!\n\nIn the meantime, you should checkout ${rules.toString()} and ${generalInfo.toString()} , they contain a lot of good-to-knows about our server and what cool stuff you can do.\nIf you'd like me to change your name on the server for you, just drop me a message and I will help you out! Then I can introduce you to our family :grin:\n\nI know Discord can be a lot to take in at first, trust me, but it's really quite a wonderful place.`)
            })
        }
    }

}