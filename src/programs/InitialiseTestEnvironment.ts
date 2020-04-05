import Discord, { TextChannel, Client } from 'discord.js';
import Tools from '../common/tools';


export default async function InitialiseTestEnvironment(bot: Client) {
    const testGuild = bot.guilds.find(g => g.name == "Test Theory Fam");
    const testChat = <TextChannel>testGuild.channels.find(c => c.name == "chat");
    testGuild.channels.create("Role-picker")
}