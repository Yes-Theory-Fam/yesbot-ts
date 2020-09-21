import {
  Client,
  Channel,
  Emoji,
  Guild,
  GuildMember,
  PartialGuildMember,
  Message,
  User,
  PartialUser,
  Collection,
  Role,
  TextChannel,
  MessageReaction,
  Speaking,
  PartialMessage,
  Presence,
  VoiceState,
} from "discord.js";
import {
  MessageManager,
  ReactionAdd,
  ReactionRemove,
  Ready,
  MemberJoin,
  GuildMemberUpdate,
  VoiceStateUpdate,
} from "./events";
import { BOT_TOKEN } from "./const";
import Firebase from "./collections/firebaseConnection";
// Imported for DB side-effects.
import "./db";
import { MemberLeave } from "./events/MemberLeave";

const bot = new Client({ partials: ["REACTION", "MESSAGE"] });
bot.login(BOT_TOKEN);

export const db = new Firebase();

//! ================= EVENT HANDLERS ====================
bot.on("channelCreate", (channelType: Channel) => null);
bot.on("channelDelete", (channel: Channel) => null);
bot.on("channelPinsUpdate", (channel: Channel, time: Date) => null);
bot.on("channelUpdate", (oldChannel: Channel, newChannel: Channel) => null);
bot.on("debug", (info: string) => null);
bot.on("disconnect", (event: any) => null);
bot.on("emojiCreate", (emoji: Emoji) => null);
bot.on("emojiDelete", (emoji: Emoji) => null);
bot.on("emojiUpdate", (oldEmoji: Emoji, newEmoji: Emoji) => null);
bot.on("error", (error: Error) => null);
bot.on("guildBanAdd", (guild: Guild, user: User | PartialUser) => null);
bot.on("guildBanRemove", (guild: Guild, user: User | PartialUser) => null);
bot.on("guildCreate", (guild: Guild) => null);
bot.on("guildDelete", (guild: Guild) => null);
bot.on("guildMemberAdd", (member: GuildMember | PartialGuildMember) => null);
bot.on(
  "guildMemberAdd",
  (member: GuildMember | PartialGuildMember) => new MemberJoin(member)
);
bot.on(
  "guildMemberAvailable",
  (member: GuildMember | PartialGuildMember) => null
);
bot.on(
  "guildMemberRemove",
  (member: GuildMember | PartialGuildMember) => new MemberLeave(member)
);
bot.on(
  "guildMembersChunk",
  (
    members: Collection<string, GuildMember | PartialGuildMember>,
    guild: Guild
  ) => null
);
bot.on(
  "guildMemberSpeaking",
  (member: GuildMember | PartialGuildMember, speaking: Readonly<Speaking>) =>
    null
);
bot.on(
  "guildMemberUpdate",
  (
    oldMember: GuildMember | PartialGuildMember,
    newMember: GuildMember | PartialGuildMember
  ) => new GuildMemberUpdate(oldMember, newMember)
);
bot.on("guildUnavailable", (guild: Guild) => null);
bot.on("guildUpdate", (oldGuild: Guild, newGuild: Guild) => null);
bot.on("guildIntegrationsUpdate", (guild: Guild) => null);
bot.on("message", (msg: Message) => new MessageManager(msg));
bot.on("messageDelete", (message: Message | PartialMessage) => null);
bot.on(
  "messageDeleteBulk",
  (messages: Collection<string, Message | PartialMessage>) => null
);
bot.on(
  "messageReactionAdd",
  (messageReaction: MessageReaction, user: User | PartialUser) =>
    new ReactionAdd(messageReaction, user)
);
bot.on(
  "messageReactionRemove",
  (messageReaction: MessageReaction, user: User | PartialUser) =>
    new ReactionRemove(messageReaction, user)
);
bot.on("messageReactionRemoveAll", (message: Message | PartialMessage) => null);
bot.on(
  "messageUpdate",
  (
    oldMessage: Message | PartialMessage,
    newMessage: Message | PartialMessage
  ) => null
);
bot.on("presenceUpdate", (oldMember: Presence, newMember: Presence) => null);
bot.on("ready", () => new Ready(bot));
bot.on("roleCreate", (role: Role) => null);
bot.on("roleDelete", (role: Role) => null);
bot.on("roleUpdate", (oldRole: Role, newRole: Role) => null);
bot.on(
  "userUpdate",
  (oldUser: User | PartialUser, newUser: User | PartialUser) => null
);
bot.on(
  "voiceStateUpdate",
  (oldMember: VoiceState, newMember: VoiceState) =>
    new VoiceStateUpdate(oldMember, newMember)
);
bot.on("warn", (info: string) => null);
bot.on("webhookUpdate", (channel: TextChannel) => null);
//! ================= /EVENT HANDLERS ===================

export default bot;
module.exports = bot; // Required for require() when lazy loading.
