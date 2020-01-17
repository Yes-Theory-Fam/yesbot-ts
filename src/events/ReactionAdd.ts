import Discord, { Snowflake, User, Channel, Guild, TextChannel } from 'discord.js';
import bot from "../index"
import Tools from '../common/tools';

class ReactionAdd {


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
                if(this.isYTF(roleToAdd)) this.handleNitro(guildMember, roleToAdd)
                else guildMember.roles.add(roleToAdd);
            }
        });
    }

    isYTF(roleToAdd: Discord.Role): boolean {
        if ((roleToAdd.name == "Lazy Lime" ||
            roleToAdd.name == "Mellow Yellow" ||
            roleToAdd.name == "Retro Red" ||
            roleToAdd.name == "Wine Red" ||
            roleToAdd.name == "Baby Blue" ||
            roleToAdd.name == "Ocean Blue" ||
            roleToAdd.name == "Swamp Green" ||
            roleToAdd.name == "Original Nitro"
        ) && (roleToAdd.guild.name == "JamiesBotPlayground" || roleToAdd.guild.name == "Yes Theory Fam")) {
            return true
        }
        return false;

    }

    handleNitro(guildMember:Discord.GuildMember, roleToAdd:Discord.Role) {
        
    }



}

export default ReactionAdd;