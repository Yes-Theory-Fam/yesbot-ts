import { createYesBotLogger } from "./log"
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
// Imported for DB side-effects.
import "./db";
import { MemberLeave } from "./events/MemberLeave";

const logger = createYesBotLogger("main", "index");
logger.info("Starting YesBot");

const bot = new Client({ partials: ["REACTION", "MESSAGE"] });
logger.debug("Logging in to Discord Gateway");
bot.login(process.env.BOT_TOKEN);

//! ================= EVENT HANDLERS ====================
bot.on(
  "guildMemberAdd",
  (member: GuildMember | PartialGuildMember) => new MemberJoin(member)
);
bot.on(
  "guildMemberRemove",
  (member: GuildMember | PartialGuildMember) => new MemberLeave(member)
);
bot.on(
  "guildMemberUpdate",
  (
    oldMember: GuildMember | PartialGuildMember,
    newMember: GuildMember | PartialGuildMember
  ) => new GuildMemberUpdate(oldMember, newMember)
);
bot.on("message", (msg: Message) => new MessageManager(msg));
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
bot.on("ready", () => new Ready(bot));
bot.on(
  "voiceStateUpdate",
  (oldMember: VoiceState, newMember: VoiceState) =>
    new VoiceStateUpdate(oldMember, newMember)
);
//! ================= /EVENT HANDLERS ===================

export default bot;
module.exports = bot; // Required for require() when lazy loading.
