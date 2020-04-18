import Discord, { Snowflake, User, Channel, Guild, TextChannel, Emoji, GuildCreateChannelOptions, PartialUser } from 'discord.js';
import bot from "../index"
import Tools from '../common/tools';
import AdventureGame from "../programs/AdventureGame"

class ReactionAdd {


    bot: Discord.Client;
    messageId: Snowflake;
    user: User;
    reaction: string;
    channel: TextChannel;
    guild: Guild;
    pureEmoji: any

    constructor(messageReaction: Discord.MessageReaction, user: User | PartialUser) {
        Tools.resolveFile("reactRoleObjects")
        this.bot = bot;
        this.user = <User>user;
        this.messageId = messageReaction.message.id;
        this.reaction = messageReaction.emoji.name;
        this.pureEmoji = messageReaction.emoji.toString()
        this.channel = <TextChannel>messageReaction.message.channel;
        this.guild = <Guild>this.channel.guild;
        this.main();
    }

    async main() {
        
        if(this.pureEmoji === '🧙' && this.channel.name == "discord-disaster" ){
            AdventureGame(this.user, this.guild, this.bot)
        }

        const reactRoleObjects = await Tools.resolveFile("reactRoleObjects");
        reactRoleObjects.forEach((element: any) => {
            if (this.messageId === element.messageId && this.reaction === element.reaction) {
                const guildMember = this.guild.members.cache.find(m => m.id == this.user.id);
                const roleToAdd = this.guild.roles.cache.find(r => r.id == element.roleId);
                guildMember.roles.add(roleToAdd);
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