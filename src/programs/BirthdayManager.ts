import { CollectorFilter, Message, GuildMember, MessageEmbed, User, MessageReaction } from "discord.js";
import { getAllCountries, getCountry } from "countries-and-timezones";

import Tools from "../common/tools";
import { textLog } from "../common/moderator";
import { BirthdayRepository } from "../entities/Birthday";

const IM_FROM = "I'm from ";
const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

export default async function BirthdayManager(message: Message) {

    const words = Tools.stringToWords(message.content);

    if (words.length < 2) {
        message.channel.send("Please type !birthday and your birthday. I prefer if you use a name for the month :robot:")
        return
    }

    const userExistingBirthday = await getUserBirthday(message.author.id);

    if (userExistingBirthday !== null) {
        message.channel.send(`I have already stored your birthday as ${formatBirthday(userExistingBirthday)} :tada:`)
        return
    }

    const birthdate = getUserBirthdate(message.content);

    if (birthdate === null) {
        message.channel.send("I'm unable to understand that date. Could you please specify it in month-date form? Like this: `!birthday december-24`. Thank you!");
        return
    }

    const birthdayMessage = await message.channel.send(`Hi <@${message.author.id}>, I think your birthday is ${formatBirthday(birthdate)}. If that is correct, please click :+1:.`)
    await birthdayMessage.react("👍");
    await birthdayMessage.react("👎");

    const filter: CollectorFilter = (reaction: MessageReaction, user: User) => {
        return user.id === message.author.id && ["👍", "👎"].indexOf(reaction.emoji.name) !== -1;
    }

    let birthdayAccepted;
    try {
        birthdayAccepted = await birthdayMessage.awaitReactions(filter, { max: 1, time: 15000, errors: ['time']});
    } catch (err) {
        // timeout probably
        return
    }

    if (birthdayAccepted.first().emoji.name === "👎") {
        message.channel.send("Okay, please be more specific and try again, or hang around for a Support to help you out! :grin:")
        return
    } else if (birthdayAccepted.first().emoji.name !== "👍") {
        // Abort if we get another emoji
        return
    } else {
        // Clean up
        await birthdayMessage.delete();
    }

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

    message.channel.send(`Okay, I'll store your birthday as ${formatBirthday(birthdate)} in the timezone ${timezone}.`);
    textLog(`Hi there! Could someone help me by executing this command? Thank you!\n\`bb.override <@${message.author.id}> set ${formatBirthday(birthdate)} ${timezone}\``);
    createBirthday(message.author.id, birthdate);
}

async function createBirthday(id: string, birthdate: Date) {
    const birthdayRepository = await BirthdayRepository();
    const birthday = birthdayRepository.create({
        userid: id,
        birthdate,
    })
    await birthdayRepository.save(birthday);
}

export function getUserBirthdate(message: string): Date | null {
    const words = message.split(/[\s,-\/\.]\s?/);

    const monthNameMatches = months.find(month => words.find(word => word.indexOf(month) !== -1));

    let monthNumMatch = -1;
    if (monthNameMatches === undefined) {
        // This will brute force by taking the first word that's a pure number..
        const matches = words.filter(word => {
            if (word.length > 2) {
                return false;
            }
            const n = parseInt(word)
            if (isNaN(n)) {
                return false
            };
            return n > 0 && n <= 12;
        })

        if (matches.length > 1 && matches[0] !== matches[1]) {
            // Maybe a bit harsh, but we abort early if we find >= 2 numbers in the message
            // where both of them are numbers <= 12 but not the same.
            return null;
        }
        monthNumMatch = parseInt(matches[0])
    }

    let messageWithoutMonthNumber = message;
    if (monthNameMatches === undefined) {
        const pre = message.substr(0, message.indexOf(monthNumMatch.toString()))
        const post = message.substr(pre.length + monthNumMatch.toString().length)
        messageWithoutMonthNumber = pre + post;
    }

    const dayMatches = messageWithoutMonthNumber.match(/(0[1-9]|[1-3]0|[1-9]+)(st|nd|rd|th)?/);

    if (!dayMatches || dayMatches.length < 2) {
        console.error("Couldn't find a match for a day in ", message)
        return null
    }

    // First one is the JS direct match, 2nd one is first capture group (\d+), which is the actual date
    const day = parseInt(dayMatches[1]);

    if (isNaN(day)) {
        console.error(`Tried to parse ${dayMatches[1]} as an int and failed!`);
        return null
    }

    const month = monthNameMatches !== undefined ? months.indexOf(monthNameMatches) : monthNumMatch - 1;

    if (monthNameMatches === undefined && monthNumMatch !== day && monthNumMatch <= 12 && day <= 12) {
        // Cannot find out since i don't know which is month and which is date
        return null
    }

    return new Date(1970, month, day)
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
        if (stopAddReactions) return;

        const currentTime = new Date();
        const currentTimeString = `Current time: ${currentTime.toLocaleTimeString('en-GB', { timeZone: tz })}`;
        const identifier = String.fromCodePoint(regionIdentifierStart + i);
        response.addField(tz, `${identifier} - ${currentTimeString}`);
        reactions.push(identifier);
    })

    let stopAddReactions = false;
    const sentMessage = await message.channel.send(response);
    response.fields
        .forEach(async (_, i) => {
            try {
                await sentMessage.react(String.fromCodePoint(regionIdentifierStart + i))
            } catch (err) {
                // If we err here, it's probably because the user already selected an emoji.
                // Best to just skip adding more emojis.
                stopAddReactions = true;
            }
        });

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

export async function getUserBirthday(userId: string): Promise<Date | null> {
    const birthdayRepository = await BirthdayRepository();

    const userExistingBirthday = await birthdayRepository.findOne({
        where: {
            userid: userId,
        },
    });

    return userExistingBirthday === undefined ? null : userExistingBirthday.birthdate;
}

export function formatBirthday(date: Date | null): string {
    return (date === null) ? 'Unknown' : `${months[date.getMonth()]}-${date.getDate()}`;
}
