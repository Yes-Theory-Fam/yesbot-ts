import Discord, { Snowflake, User, Channel, Guild, TextChannel } from 'discord.js';
import bot from "../index"
import Tools from '../common/tools';

class ReactionRemove {


    bot: Discord.Client;
    messageId: Snowflake;
    user: User;
    reaction: string;
    channel: TextChannel;
    guild: Guild;

    constructor(messageReaction: Discord.MessageReaction, user: User) {
        Tools.resolveFile("reactRoleObjects")
        this.bot = bot;
        this.user = user;
        this.messageId = messageReaction.message.id;
        this.reaction = messageReaction.emoji.name;
        this.channel = <TextChannel>messageReaction.message.channel;
        this.guild = <Guild>this.channel.guild;
        this.main();
    }

    async main() {
        const reactRoleObjects = await Tools.resolveFile("reactRoleObjects");
        reactRoleObjects.forEach((element: any) => {
            if (this.messageId === element.messageId && this.reaction === element.reaction) {
                const guildMember = this.guild.members.find(m => m.id == this.user.id);
                const roleToAdd = this.guild.roles.find(r => r.id == element.roleId);
                guildMember.roles.remove(roleToAdd);
            }
        });
    }



}

export default ReactionRemove;