import * as Discord from 'discord.js';
import { Message, Raw, ReactionAdd, ReactionRemove, Ready, MemberJoin, GuildMemberUpdate } from './events';
import { BOT_PROD_TOKEN, BOT_DEV_TOKEN } from './const';


const bot = new Discord.Client({ partials: ['REACTION', 'MESSAGE']});
if(process.platform == "linux") bot.login(BOT_PROD_TOKEN);
else bot.login(BOT_DEV_TOKEN);

//! ================= EVENT HANDLERS ====================
bot.on("channelCreate", (channelType:Discord.Channel) => null);
bot.on("channelDelete", (channel: Discord.Channel) => null);
bot.on("channelPinsUpdate", (channel: Discord.Channel, time: Date) => null);
bot.on("channelUpdate", (oldChannel: Discord.Channel, newChannel: Discord.Channel) => null);
bot.on("debug",  (info: string) => null);
bot.on("disconnect",  (event: any) => null);
bot.on("emojiCreate", (emoji: Discord.Emoji) => null);
bot.on("emojiDelete", (emoji: Discord.Emoji) => null);
bot.on("emojiUpdate", (oldEmoji: Discord.Emoji, newEmoji: Discord.Emoji) => null);
bot.on("error",  (error: Error) => null);
bot.on("guildBanAdd", (guild: Discord.Guild, user: Discord.User) => null);
bot.on("guildBanRemove", (guild: Discord.Guild, user: Discord.User) => null);
bot.on("guildCreate", (guild: Discord.Guild) => null);
bot.on("guildDelete", (guild: Discord.Guild) => null);
bot.on("guildMemberAdd", (member: Discord.GuildMember) => null);
bot.on("guildMemberAdd", (member: Discord.GuildMember) => new MemberJoin(member));
bot.on("guildMemberAvailable", (member: Discord.GuildMember) => null);
bot.on("guildMemberRemove", (member: Discord.GuildMember) => null);
bot.on("guildMembersChunk", (members: Discord.GuildMember[], guild: Discord.Guild) => null);
bot.on("guildMemberSpeaking", (member: Discord.GuildMember, speaking: boolean) => null);
bot.on("guildMemberUpdate", (oldMember: Discord.GuildMember, newMember: Discord.GuildMember) => new GuildMemberUpdate(oldMember, newMember));
bot.on("guildUnavailable", (guild: Discord.Guild) => null);
bot.on("guildUpdate", (oldGuild: Discord.Guild, newGuild: Discord.Guild) => null);
bot.on("guildIntegrationsUpdate", (guild: Discord.Guild) => null);
bot.on("message", (msg: Discord.Message) => new Message(msg));
bot.on("messageDelete", (message: Discord.Message) => null);
bot.on("messageDeleteBulk", (messages: Discord.Collection<Discord.Snowflake, Discord.Message>) => null);
bot.on("messageReactionAdd", (messageReaction: Discord.MessageReaction, user: Discord.User) => new ReactionAdd(messageReaction, user));
bot.on("messageReactionRemove", (messageReaction: Discord.MessageReaction, user: Discord.User) => new ReactionRemove(messageReaction, user));
bot.on("messageReactionRemoveAll", (message: Discord.Message) => null);
bot.on("messageUpdate", (oldMessage: Discord.Message, newMessage: Message) => null);
bot.on("presenceUpdate", (oldMember: Discord.GuildMember, newMember: Discord.GuildMember) => null);
bot.on("raw",(event:any) => new Raw(event));
bot.on("ready", () => new Ready());
bot.on("roleCreate", (role: Discord.Role) => null);
bot.on("roleDelete", (role: Discord.Role) => null);
bot.on("roleUpdate", (oldRole: Discord.Role, newRole: Discord.Role) => null);
bot.on("typingStart", (channel: Discord.Channel, user: Discord.User) => null);
bot.on("typingStop", (channel: Discord.Channel, user: Discord.User) => null);
bot.on("userUpdate", (oldUser: Discord.User, newUser: Discord.User) => null);
bot.on("voiceStateUpdate", (oldMember: Discord.GuildMember, newMember: Discord.GuildMember) => null);
bot.on("warn",  (info: string) => null);
bot.on("webhookUpdate", (channel: Discord.TextChannel) => null);
//! ================= /EVENT HANDLERS ===================
export default bot;