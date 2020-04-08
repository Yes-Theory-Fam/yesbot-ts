import Discord, { TextChannel } from 'discord.js';

export default function Unassigned(message: Discord.Message) {
    const guild = message.guild;

    const UnassignedRole = guild.roles.cache.find(role => role.name === "Unassigned");
    const SupportRole = guild.roles.cache.find(role => role.name === "Support");

    const authorIsSupport = message.guild.member(message.author).roles.cache.some(role => role.id === SupportRole.id);
    if (!authorIsSupport)
        return;

    const isInModSection = (message.channel as TextChannel).parent.name.toLowerCase() === "mod section";
    if (!isInModSection)
        return;

    const missedUsers = guild.members.cache.mapValues(member => {
        console.log(`Checked member: ${member.displayName}, ${member.roles.cache.array()}`);
        return member;
    }).filter((member) => member.roles.cache.size === 1); // @everyone

    missedUsers.forEach(member => member.roles.add(UnassignedRole));

    message.channel.send(`Added Unassigned role to ${missedUsers.size} members of the server!`);

    const whoopsUsers = guild.members.cache
        .filter(member => member.roles.cache.some(role => role.id === UnassignedRole.id))
        .filter(member => member.roles.cache.size > 2); // @everyone + Unassigned + at least another role.
    whoopsUsers.forEach(member => member.roles.remove(UnassignedRole));
    message.channel.send(`Removed Unassigned role from ${whoopsUsers.size} members of the server!`);
}
