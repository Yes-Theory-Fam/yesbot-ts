import Discord, { TextChannel } from 'discord.js';
import Tools from '../common/tools';
import {isRegistered} from '../common/moderator';
import flag from 'country-code-emoji';
import { Country, countries } from "../collections/flagEmojis";


export default async function WhereAreYouFromManager(pMessage: Discord.Message) {

    const newUser = !isRegistered(pMessage.member);
    let countryToAssign: Country;

    if(newUser) {
        countries.forEach((country:Country) => {
            if(country.emoji === pMessage.content || pMessage.content.toLowerCase().includes(country.name.toLowerCase())) countryToAssign = country;
        });

        if(countryToAssign) {
            const roleToAssign = pMessage.guild.roles.cache.find(role => role.name.toLowerCase().includes(countryToAssign.name.toLowerCase()));
            pMessage.member.roles.add(roleToAssign);
            pMessage.react("👍")
            pMessage.member.createDM().then(dmChannel => {
                const rules = pMessage.guild.channels.cache.find(c => c.name === "rules");
                const generalInfo = pMessage.guild.channels.cache.find(c => c.name === "general-info")
                dmChannel.send(`Hey! My name is YesBot, I'm so happy to see you've made it into our world, we really hope you stick around!\n\nIn the meantime, you should checkout ${rules.toString()} and ${generalInfo.toString()} , they contain a lot of good-to-knows about our server and what cool stuff you can do.\nIt would be awesome to know your name, could you reply to this message with your first name please? Then I can introduce you to our family :grin:\n\nI know Discord can be a lot to take in at first, trust me, but it's really quite a wonderful place.`)
            })
        }
    }

}