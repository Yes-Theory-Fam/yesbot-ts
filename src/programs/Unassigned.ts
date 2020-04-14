import Discord, { TextChannel, GuildMember } from 'discord.js';
import { MODERATOR_ROLE_NAME } from '../const';

export default function Unassigned(message: Discord.Message) {
    const guild = message.guild;

    const UnassignedRole = guild.roles.cache.find(role => role.name === "Unassigned");

    const authorIsSupport = message.guild.member(message.author).roles.cache.some(role => role.name === MODERATOR_ROLE_NAME);
    if (!authorIsSupport)
        return;

    const isInModSection = (message.channel as TextChannel).name === "permanent-testing";
    if (!isInModSection)
        return;
    const missedUsers = guild.members.cache.filter((member) => member.roles.cache.size === 1);

    missedUsers.forEach(member => member.roles.add(UnassignedRole));

    message.channel.send(`Added Unassigned role to ${missedUsers.size} members of the server!`);

    const whoopsUsers = guild.members.cache
        .filter(member => member.roles.cache.some(role => role.id === UnassignedRole.id))
        .filter(member => member.roles.cache.size > 2); // @everyone + Unassigned + at least another role.
    whoopsUsers.forEach(member => member.roles.remove(UnassignedRole));
    message.channel.send(`Removed Unassigned role from ${whoopsUsers.size} members of the server!`);
}
