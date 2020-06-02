import Discord, { TextChannel, User } from 'discord.js';
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
            pMessage.react("👍")
            pMessage.member.createDM().then(dmChannel => {
                const rules = pMessage.guild.channels.cache.find(c => c.name === "rules");
                const generalInfo = pMessage.guild.channels.cache.find(c => c.name === "general-info")
                const welcomeChat = <TextChannel>pMessage.guild.channels.cache.find(c => c.name === "welcome-chat");
                welcomeChat.send(getWelcomeMessage(pMessage.member.user))
                dmChannel.send(`Hey! My name is YesBot, I'm so happy to see you've made it into our world, we really hope you stick around!\n\nIn the meantime, you should checkout ${rules.toString()} and ${generalInfo.toString()} , they contain a lot of good-to-knows about our server and what cool stuff you can do.\nIf you'd like me to change your name on the server for you, just drop me a message and I will help you out! Then I can introduce you to our family :grin:\n\nI know Discord can be a lot to take in at first, trust me, but it's really quite a wonderful place.`)
            })
        }
    }

}

const getWelcomeMessage = (user:User) => {
    const welcomeMessages = [
        `${user.toString()}> just joined the party! Make some noise everyone :zany_face:`,
        `${user.toString()}> just *sliiiiid* into the server.`,
        `Everyone welcome ${user.toString()}> !`,
        `Welcome ${user.toString()}, say hi! `,
        `Glad you're finally here ${user.toString()}, we've been waiting for you :heart_eyes: `,
        `Welcome ${user.toString()}. We hope you brought :pizza: `,
        `${user.toString()} just hopped in :rabbit2: What a lovely day! `,
        `Yayyyy, ${user.toString()} made it!`,
        `${user.toString()} just showed up, make some space for them! `,
        `${user.toString()} is here :tada:`,
        `${user.toString()} just landed :rocket:`
        ];
    return welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];

    
    
}

