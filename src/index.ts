import { createYesBotLogger } from "./log";
import {
  Client,
  GuildMember,
  Message,
  MessageReaction,
  PartialGuildMember,
  PartialUser,
  User,
  VoiceState,
} from "discord.js";
import {
  GuildMemberUpdate,
  MemberJoin,
  MemberLeave,
  MessageManager,
  ReactionAdd,
  ReactionRemove,
  Ready,
  VoiceStateUpdate,
} from "./events";
import rambo, { DiscordEvent } from "./events/handler";

const logger = createYesBotLogger("main", "index");
logger.info("Starting YesBot");

logger.info("Initializing rambo");
rambo.initialize();

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
bot.on("message", (msg: Message) => {
  new MessageManager(msg);
  rambo.handleEvent(DiscordEvent.Message, msg);
});
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
