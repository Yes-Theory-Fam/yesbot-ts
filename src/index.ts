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
  guildMemberUpdate,
  memberLeave,
  messageManager,
  reactionAdd,
  reactionRemove,
  ready,
  voiceStateUpdate,
} from "./events";
import distribution, { DiscordEvent } from "./event-distribution";

const logger = createYesBotLogger("main", "index");
logger.info("Starting YesBot");

logger.info("Initializing event-distribution");
distribution.initialize();

const bot = new Client({ partials: ["REACTION", "MESSAGE"] });
logger.debug("Logging in to Discord Gateway");
bot.login(process.env.BOT_TOKEN);

//! ================= EVENT HANDLERS ====================
bot.on("guildMemberRemove", (member: GuildMember | PartialGuildMember) =>
  memberLeave(member)
);
bot.on(
  "guildMemberUpdate",
  async (
    oldMember: GuildMember | PartialGuildMember,
    newMember: GuildMember | PartialGuildMember
  ) => {
    await guildMemberUpdate(oldMember, newMember);
    distribution.handleEvent(
      DiscordEvent.GUILD_MEMBER_UPDATE,
      oldMember,
      newMember
    );
  }
);
bot.on("message", async (msg: Message) => {
  await messageManager(msg);
  distribution.handleEvent(DiscordEvent.MESSAGE, msg);
});
bot.on(
  "messageReactionAdd",
  async (messageReaction: MessageReaction, user: User | PartialUser) => {
    await reactionAdd(messageReaction, user);
    distribution.handleEvent(DiscordEvent.REACTION_ADD, messageReaction, user);
  }
);
bot.on(
  "messageReactionRemove",
  async (messageReaction: MessageReaction, user: User | PartialUser) => {
    await reactionRemove(messageReaction, user);
    distribution.handleEvent(
      DiscordEvent.REACTION_REMOVE,
      messageReaction,
      user
    );
  }
);
bot.on("ready", async () => {
  await ready(bot);
  distribution.handleEvent(DiscordEvent.READY, bot);
});
bot.on("voiceStateUpdate", (oldMember: VoiceState, newMember: VoiceState) =>
  voiceStateUpdate(oldMember, newMember)
);
//! ================= /EVENT HANDLERS ===================

export default bot;
module.exports = bot; // Required for require() when lazy loading.
