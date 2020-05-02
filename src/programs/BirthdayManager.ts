import { Message } from "discord.js";
import Tools from "../common/tools";

export default async function BirthdayManager(message: Message) {

    const words = Tools.stringToWords(message.content);

    const [command, birthdate] = words;

    console.log({
        birthdate,
    })
}

createBirthday(id, Date)
