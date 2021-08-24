import GameHub from "./game-hub";
import {
  AwaitReactionsOptions,
  GuildMember,
  Message,
  MessageReaction,
  Snowflake,
  TextChannel,
  User,
  VoiceChannel,
} from "discord.js";
import { ConfiguratorConfig } from "./configurator-validator";

export interface GameConfig<T extends SessionConfig> {
  emoji: string;
  name: string;
  rules: string;
  howToPlay: string;
  configuration?: ConfiguratorConfig<T>;
  minPlayers?: number;
  maxPlayers?: number;
  voiceRequired?: boolean;
  dmsRequired?: boolean;
}

export interface SessionConfig {
  leaderId: Snowflake;
  players: GuildMember[];
  channel: TextChannel;
  voiceChannel?: VoiceChannel;
}

export abstract class GameSession<T extends SessionConfig> {
  // TODO fix if possible
  public static config: GameConfig<any>;
  protected abstract sessionConfig: Partial<T>;

  public constructor(protected hub: GameHub) {}

  public get channel(): TextChannel {
    return this.sessionConfig.channel;
  }

  public get voiceChannel(): VoiceChannel | undefined {
    return this.sessionConfig.voiceChannel ?? undefined;
  }

  public get players(): GuildMember[] {
    return this.sessionConfig.players;
  }

  public get leader(): GuildMember {
    return this.channel.guild.members.resolve(this.sessionConfig.leaderId);
  }

  public async signUp(): Promise<GuildMember[]> {
    const signupTime = 60 * 1000;

    const constructor = this.constructor as typeof GameSession;
    const config = constructor.config;
    const { emoji, name, maxPlayers } = config;

    const announcement = await this.hub.announce(
      `A new game of ${name} is about to start. React with ${emoji} within the next minute to join!`
    );
    await announcement.react(emoji);
    const reactionFilter = (reaction: MessageReaction, user: User) =>
      !user.bot && reaction.emoji.name === emoji;

    const options: AwaitReactionsOptions = { time: signupTime };
    if (maxPlayers) {
      options.max = maxPlayers;
    }

    const signUps = await announcement.awaitReactions({
      filter: reactionFilter,
      ...options,
    });

    const reaction = signUps.find((reaction) => reaction.emoji.name === emoji);
    await announcement.delete();
    if (!reaction) {
      return [];
    }

    return reaction.users.cache
      .filter((user) => !user.bot)
      .map((user) => this.hub.guild.members.resolve(user.id));
  }

  public setBaseConfiguration(
    channel: TextChannel,
    players: GuildMember[],
    leaderId: Snowflake,
    voiceChannel: VoiceChannel | undefined
  ) {
    this.sessionConfig.channel = channel;
    this.sessionConfig.voiceChannel = voiceChannel;
    this.sessionConfig.players = [...players];
    this.sessionConfig.leaderId = leaderId;
  }

  public async patchConfig(partial: Partial<T>): Promise<void> {
    if (this.sessionConfig) {
      this.sessionConfig = { ...this.sessionConfig, ...partial };
    } else {
      this.sessionConfig = partial;
    }
  }

  public start(): void {
    if (!this.channel) {
      throw Error(
        "this.channel not defined! Have you called super.patchConfig in your patchConfig implementation?"
      );
    }

    const constructor = this.constructor as typeof GameSession;
    const config = constructor.config;
    this.channel
      .send("**How to play**\n" + config.howToPlay)
      .then(() => this.channel.send("**Rules**\n" + config.rules));
  }

  // This is for a future feature
  public pause(): void {}

  // This is for a future feature
  public resume(): void {}

  // Games are not forced to handle input so it's not abstract.
  public handleInput(message: Message): void {}

  public async end() {
    await this.channel.send(
      "This marks the end of the game! You can return back to the <#" +
        this.hub.channel.id +
        "> channel now as this session is closed and the channel(s) will be deleted in a minute."
    );
    this.hub.closeSession(this);
  }

  // This is for a future feature
  protected loadGame(gameConfig: T) {}

  // This is for a future feature
  protected saveGame() {
    return this.sessionConfig;
  }
}
