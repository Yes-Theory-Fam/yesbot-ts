import { Message, Role, GuildManager } from "discord.js";
import Tools from "../common/tools";

export default async function BirthdayManager(message: Message) {

    const words = Tools.stringToWords(message.content);

    const [command, birthdate] = words;

    const countryRole:Role = fetchUserCountryRoles(message.member);
    const timezone = timezoneFromRole(countryRole);

    //TODO construct utcString from timeZone and birthdate default 1970 year

    const birthday = new Date(utcString)
    createBirthday(message.author.id, date)


}

const createBirthday = (id:string, Date:Date) => {
    const birthdays = 
}


