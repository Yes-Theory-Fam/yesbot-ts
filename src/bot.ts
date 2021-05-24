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
import { createYesBotLogger } from "./log";

const logger = createYesBotLogger("main", "Bot");

export class Bot {
  private static instance: Bot;
  private readonly client: Client;

  constructor() {
    this.client = new Client({ partials: ["REACTION", "MESSAGE"] });
    this.client.login(process.env.BOT_TOKEN).then(r => this.createEventListeners());
    logger.debug("Logging in to Discord Gateway");
  }

  public static getInstance(): Bot {
    if (!Bot.instance) {
      Bot.instance = new Bot();
    }

    return Bot.instance;
  }

  public getClient(): Client {
    return this.client;
  }

  private createEventListeners() {
    this.client.on(
      "guildMemberAdd",
      (member: GuildMember | PartialGuildMember) => new MemberJoin(member),
    );
    this.client.on(
      "guildMemberRemove",
      (member: GuildMember | PartialGuildMember) => new MemberLeave(member),
    );
    this.client.on(
      "guildMemberUpdate",
      (
        oldMember: GuildMember | PartialGuildMember,
        newMember: GuildMember | PartialGuildMember,
      ) => new GuildMemberUpdate(oldMember, newMember),
    );
    this.client.on("message", (msg: Message) => new MessageManager(msg));
    this.client.on(
      "messageReactionAdd",
      (messageReaction: MessageReaction, user: User | PartialUser) =>
        new ReactionAdd(messageReaction, user),
    );
    this.client.on(
      "messageReactionRemove",
      (messageReaction: MessageReaction, user: User | PartialUser) =>
        new ReactionRemove(messageReaction, user),
    );
    this.client.on("ready", () => new Ready(this.client));
    this.client.on(
      "voiceStateUpdate",
      (oldMember: VoiceState, newMember: VoiceState) =>
        new VoiceStateUpdate(oldMember, newMember),
    );
  }
}
