import Discord from 'discord.js';

// From http://www.unicode.org/reports/tr51/tr51-18.html#EBNF_and_Regex
const unicodeEmojiRegex = /\p{RI}\p{RI}|\p{Emoji}(\p{Emoji_Modifier_Base}|\uFE0F\u20E3?|[\u{E0020}-\u{E007E}]+\u{E007F})?(\u{200D}\p{Emoji}(\p{Emoji_Modifier_Base}|\uFE0F\u20E3?|[\u{E0020}-\u{E007E}]+\u{E007F})?)*/gu;

/**
 * Function to find poll options in a message based on a regex.
 * 
 * @param messageContent The content of the message to scan for options
 * @param anyMatchRegex A regex that checks if there is at least one match in the entire message
 * @param actualMatchRegex A regex that extracts the option from each line
 */
const getPollOptions = (messageContent: string, anyMatchRegex: RegExp, actualMatchRegex: RegExp) => {
    if (!anyMatchRegex.test(messageContent)) return [];

    // Match the first word between colons, including the colons per line
    let match = actualMatchRegex.exec(messageContent);

    // Skip over the lines without match
    while (!match) {
        match = actualMatchRegex.exec(messageContent);
    }

    const usedEmojis = [];

    // Push the matches
    while (match) {
        usedEmojis.push(match[1]);
        match = actualMatchRegex.exec(messageContent)
    }

    return usedEmojis;
}

// Potentially naive approach but looking at the recent polls it's realistic
const getOptions = (messageContent: string) => {
    const emojis = getPollOptions(messageContent, unicodeEmojiRegex, RegExp("^\s*(" + unicodeEmojiRegex.source + ").*$", "gum"));
    if (emojis.length > 1) return emojis;

    const capitals = getPollOptions(messageContent, /^[A-Z]\p{P}/um, /^([A-Z])\p{P}.*$/gum);
    const letterToEmoji = (letter: string) => {
        const unicodeOffset = 0x1F1E6; //Regional Indicator A
        const asciiOffset = "A".charCodeAt(0);

        if (letter === 'B') return '🅱️';
        const letterIndex = letter.charCodeAt(0) - asciiOffset;
        const unicodeCodePoint = unicodeOffset + letterIndex;
        return String.fromCodePoint(unicodeCodePoint);
    }

    if (capitals.length > 1) return capitals.map(letterToEmoji);

    const defaultOptions = ['🇦', '🅱️'];
    console.log("Couldn't find options in poll; defaulting to " + defaultOptions);
    
    return defaultOptions;
}

export default async function Poll(pMessage: Discord.Message) {
    const options = getOptions(pMessage.content);
    const uniqueOptions = options.filter((value, index, self) => self.indexOf(value) === index);

    if (uniqueOptions.length < 2) {
        pMessage.reply("More than one distinct option is required!").then(message => {
            // message.delete({timeout: 10000});
        }).catch(console.log);
        pMessage.delete();
        return;
    }

    for (let i = 0; i < options.length; i++) {
        await pMessage.react(options[i]);
    }
}