import { createYesBotLogger } from "./log";
import {
  Client,
  GuildMember,
  Message,
  MessageReaction,
  PartialGuildMember,
  PartialMessageReaction,
  PartialUser,
  User,
  VoiceState,
} from "discord.js";
import {
  guildMemberUpdate,
  memberLeave,
  messageManager,
  ready,
  voiceStateUpdate,
} from "./events";
import distribution, { DiscordEvent } from "./event-distribution";
import { LoadCron } from "./load-cron";

const logger = createYesBotLogger("main", "index");
logger.info("Starting YesBot");

const bot = new Client({
  intents: [
    "GUILDS",
    "GUILD_MEMBERS",
    "GUILD_BANS",
    "GUILD_VOICE_STATES",
    "GUILD_MESSAGES",
    "GUILD_MESSAGE_REACTIONS",
    "DIRECT_MESSAGES",
    "DIRECT_MESSAGE_REACTIONS",
  ],
  partials: ["REACTION", "MESSAGE"],
});
logger.info("Initializing event-distribution");
distribution.initialize().then(() => {
  logger.debug("Logging in to Discord Gateway");
  return bot.login(process.env.BOT_TOKEN);
});

//! ================= EVENT HANDLERS ====================
bot.on(
  "guildMemberRemove",
  async (member: GuildMember | PartialGuildMember) => {
    await distribution.handleEvent(DiscordEvent.MEMBER_LEAVE, member);
    await memberLeave(member);
  }
);
bot.on("guildMemberAdd", async (member: GuildMember | PartialGuildMember) => {
  await distribution.handleEvent(DiscordEvent.MEMBER_JOIN, member);
});
bot.on(
  "guildMemberUpdate",
  async (
    oldMember: GuildMember | PartialGuildMember,
    newMember: GuildMember | PartialGuildMember
  ) => {
    await guildMemberUpdate(oldMember, newMember);
    await distribution.handleEvent(
      DiscordEvent.GUILD_MEMBER_UPDATE,
      oldMember,
      newMember
    );
  }
);
bot.on("messageCreate", async (msg: Message) => {
  await messageManager(msg);
  await distribution.handleEvent(DiscordEvent.MESSAGE, msg);
});
bot.on(
  "messageReactionAdd",
  async (
    messageReaction: MessageReaction | PartialMessageReaction,
    user: User | PartialUser
  ) => {
    await distribution.handleEvent(
      DiscordEvent.REACTION_ADD,
      messageReaction,
      user
    );
  }
);
bot.on(
  "messageReactionRemove",
  async (
    messageReaction: MessageReaction | PartialMessageReaction,
    user: User | PartialUser
  ) => {
    await distribution.handleEvent(
      DiscordEvent.REACTION_REMOVE,
      messageReaction,
      user
    );
  }
);
bot.on("ready", async () => {
  await distribution.handleEvent(DiscordEvent.READY, bot);
  LoadCron.init();
  await ready(bot);
});
bot.on(
  "voiceStateUpdate",
  async (oldState: VoiceState, newState: VoiceState) => {
    await distribution.handleEvent(
      DiscordEvent.VOICE_STATE_UPDATE,
      oldState,
      newState
    );
    await voiceStateUpdate(oldState, newState);
  }
);
//! ================= /EVENT HANDLERS ===================

export default bot;
module.exports = bot; // Required for require() when lazy loading.
