import {
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
import distribution, { DiscordEvent } from "./event-distribution/index.js";
import { memberLeave, ready } from "./events/index.js";
import { legacyCommandHandler } from "./events/message.js";
import { LoadCron } from "./load-cron.js";
import { createYesBotLogger } from "./log.js";

import * as Sentry from "@sentry/node";

const logger = createYesBotLogger("main", "index");
logger.info("Starting YesBot");

if (process.env.NODE_ENV === "production") {
  Sentry.init({
    dsn: "https://eb5dd519edd248a29948203775ac45fc@o4505341251354624.ingest.sentry.io/4505341256990720",
    tracesSampleRate: 1.0,
  });
}

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
    await memberLeave(member).catch((error) => {
      Sentry.captureException(error, {
        extra: {
          event: DiscordEvent.MEMBER_LEAVE,
          args: JSON.stringify([member], null, 2),
        },
      });
      logger.error("Error in legacy memberLeave handler: ", error);
    });
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
  await ready(bot).catch((error) => {
    Sentry.captureException(error, { extra: { event: DiscordEvent.READY } });
    logger.error("Error in legacy ready handler: ", error);
  });
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

BigInt.prototype.toJSON = function () {
  return this.toString();
};

process.on("uncaughtException", (error) => {
  Sentry.captureException(error, { level: "fatal" });
});

export default bot;
