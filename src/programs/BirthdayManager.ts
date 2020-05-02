import { CollectorFilter, Message, GuildMember, MessageEmbed, User, MessageReaction } from "discord.js";
import { getAllCountries, getCountry } from "countries-and-timezones";

import Tools from "../common/tools";

const IM_FROM = "I'm from ";

export default async function BirthdayManager(message: Message) {

    const words = Tools.stringToWords(message.content);

    const [command, birthdate] = words;

    let timezone;
    try {
        timezone = await getUserTimezone(message);
    } catch (err) {
        if (err.message === 'Too many available time zones') {
            message.channel.send("Ouch, it seems like you have an extreme amounts of timezones available!\nPlease wait for a support :grin:");
        } else if (err.message === "time expired") {
            message.react("⏰");
        } else {
            console.error('birthday err', err);
            message.channel.send("Hmm, something went wrong. Please contact my engineers if this seems unreasonable. :nerd:")
        }
        return;
    }

    // if we're here, we have 'timezone' as the timezone for the user. Now we can do whatever we want!
}

const createBirthday = (id:string, Date:Date) => {
    // const birthdays =
}

async function getUserTimezone(message: Message): Promise<string> {
    const countryRole = await fetchUserCountryRoles(message.member);

    const timezones = countryRole
        .map(timezonesFromRole)
        .reduce((prev, curr) => [...prev, ...curr], [])
        .filter(tz => tz.indexOf("/") !== -1);

    if (timezones.length > 20) {
        throw new Error('Too many available time zones');
    }

    const response = new MessageEmbed();
    response.setTitle("Pick your timezone");

    const regionIdentifierStart = 127462;
    let reactions: string[] = [];

    timezones.forEach((tz, i)=> {
        const currentTime = new Date();
        const currentTimeString = `Current time: ${currentTime.toLocaleTimeString('en-GB', { timeZone: tz })}`;
        const identifier = String.fromCodePoint(regionIdentifierStart + i);
        response.addField(tz, `${identifier} - ${currentTimeString}`);
        reactions.push(identifier);
    })

    const sentMessage = await message.channel.send(response);
    response.fields
        .forEach(async (_, i) =>
            sentMessage.react(String.fromCodePoint(regionIdentifierStart + i))
        );

    const filter: CollectorFilter = (reaction: MessageReaction, user: User) => {
        return user.id !== sentMessage.author.id && reactions.includes(reaction.emoji.name)
    }

    let received;
    try {
        received = await sentMessage.awaitReactions(filter, { max: 1, time: 60000, errors: ['time']})
    } catch (err) {
        if (err.toString() === "[object Map]") {
            await sentMessage.delete();
            throw new Error('time expired');
        } else {
            throw err;
        }
    }

    const reaction = received.first();
    const selectedTz = timezones[reactions.indexOf(reaction.emoji.name)];

    message.channel.send(`Found timezone for <@${message.author.id}> to be ${selectedTz}.`);
    sentMessage.delete();
    return selectedTz;
}

async function fetchUserCountryRoles(user: GuildMember) {
    return user.roles.cache
        .filter(role => role.name.startsWith("I'm from "))
        .map(role => role.name.substring(IM_FROM.length, role.name.indexOf("!")));
}

function timezonesFromRole(country: string): readonly string[] {
    // Edge cases
    switch (country) {
        case "the USA":
            // This is to slim down the extremely big list of US TZs.
            // Also, we remove any timezone that JS is unable to display.
            const usTZs = getCountry("US").timezones
                .filter(tz => tz.startsWith('America/'))
                .filter(tz => tz.lastIndexOf('/') === tz.indexOf('/'));
            return usTZs.map(tz => {
                try {
                    new Date().toLocaleTimeString('en-GB', { timeZone: tz });
                    return tz;
                } catch (e) {
                    return null;
                }
            }).filter(tz => tz !== null);
        case "the UK":
            return getCountry("GB").timezones;
    }

    // let's find what tz's are available for this country

    // REALLY
    const countries = getAllCountries();
    const countryId = Object.keys(countries)
        .find(id => countries[id].name === country);
    return countries[countryId].timezones;
}
