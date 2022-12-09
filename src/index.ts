import {
  ChannelType,
  Client,
  GatewayIntentBits,
  GuildMember,
  Interaction,
  Message,
  MessageReaction,
  PartialGuildMember,
  PartialMessageReaction,
  Partials,
  PartialUser,
  ThreadChannel,
  User,
  VoiceState,
} from "discord.js";
import distribution, { DiscordEvent } from "./event-distribution";
import { guildMemberUpdate, memberLeave, ready } from "./events";
import { legacyCommandHandler } from "./events/message";
import { LoadCron } from "./load-cron";
import { createYesBotLogger } from "./log";

const logger = createYesBotLogger("main", "index");
logger.info("Starting YesBot");

const bot = new Client({
  intents: [
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.DirectMessageReactions,

    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildBans,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildVoiceStates,

    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel, Partials.Message, Partials.Reaction],
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
    await memberLeave(member).catch((error) =>
      logger.error("Error in legacy memberLeave handler: ", error)
    );
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
    await guildMemberUpdate(oldMember, newMember).catch((error) =>
      logger.error("Error in legacy guildMemberUpdate handler: ", error)
    );
    await distribution.handleEvent(
      DiscordEvent.GUILD_MEMBER_UPDATE,
      oldMember,
      newMember
    );
  }
);
bot.on("messageCreate", async (msg: Message) => {
  await legacyCommandHandler(msg);
  await distribution.handleEvent(DiscordEvent.MESSAGE, msg);
});
bot.on("interactionCreate", async (interaction: Interaction) => {
  await distribution.handleInteraction(interaction);
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
  await ready(bot).catch((error) =>
    logger.error("Error in legacy ready handler: ", error)
  );
  await distribution.handleEvent(DiscordEvent.READY, bot);
  LoadCron.init(bot);
});
bot.on(
  "voiceStateUpdate",
  async (oldState: VoiceState, newState: VoiceState) => {
    await distribution.handleEvent(
      DiscordEvent.VOICE_STATE_UPDATE,
      oldState,
      newState
    );
  }
);
bot.on(
  "threadCreate",
  async (channel: ThreadChannel, newlyCreated: boolean) => {
    await distribution.handleEvent(
      DiscordEvent.THREAD_CREATE,
      channel,
      newlyCreated
    );
  }
);

//! ================= /EVENT HANDLERS ===================

export default bot;
module.exports = bot; // Required for require() when lazy loading.
