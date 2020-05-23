import Discord, { Snowflake, User, Channel, Guild, TextChannel, Emoji, GuildCreateChannelOptions, PartialUser, Message } from 'discord.js';
import bot from "../index"
import Tools from '../common/tools';
import AdventureGame from "../programs/AdventureGame"
import { MessageRepository } from '../entities/Message';
import { backfillReactions } from '../programs/GroupManager';
import { hasRole } from '../common/moderator';

class ReactionAdd {


    bot: Discord.Client;
    message: Message;
    messageId: Snowflake;
    user: User;
    reaction: string;
    channel: TextChannel;
    guild: Guild;
    pureEmoji: any

    constructor(messageReaction: Discord.MessageReaction, user: User | PartialUser) {
        this.bot = bot;
        this.user = <User>user;
        this.message = messageReaction.message;
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

        this.handleChannelToggleReaction();
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

    async handleChannelToggleReaction() {
        const messageRepository = await MessageRepository();
        const storedMessage = await messageRepository.findOne({
            where: {
                id: this.messageId,
            }
        });

        if (storedMessage === undefined) {
            // abort if we don't know of a trigger for this message
            return
        }

        // Make sure we know what channel this message is forever
        if (storedMessage.channel === null) {
            // record what channel this message is in
            await messageRepository.save({
                ...storedMessage,
                channel: this.channel.id,
            });
            this.message.react(this.reaction);
            backfillReactions(this.messageId, this.channel.id, this.guild);
        }

        Tools.addPerUserPermissions(this.reaction, this.messageId, this.guild, this.guild.member(this.user));
    }
}

export default ReactionAdd;
