import {
  GuildMember,
  Message,
  MessageEmbed,
  OverwriteResolvable,
  Permissions,
  Snowflake,
  TextChannel,
} from "discord.js";
import { GameSession } from "./game-session";
import Tools from "../common/tools";
import { ConfiguratorValidator } from "./configurator-validator";
import { GameConfigurator } from "./game-configurator";

const generalCommands = ["!rules", "!howtoplay", "!end"];

type Config = { clazz: new (hub: GameHub) => GameSession<any>; name: string };

export default class GameHub {
  channel: TextChannel;
  private games: Record<string, Config> = {};
  private sessions: Record<string, GameSession<any>> = {};

  get guild() {
    return this.channel.guild;
  }

  private static handleGeneralCommand<T extends GameSession<any>>(
    command: string,
    session: T,
    message: Message
  ) {
    const constructor = session.constructor as typeof GameSession;
    const config = constructor.config;
    switch (command) {
      case "!rules":
        message.reply(config.rules);
        break;
      case "!howtoplay":
        message.reply(config.howToPlay);
        break;
      case "!end":
        if (session.leader.id == message.author.id) {
          session.channel
            .send("The gameleader has decided to end the game!")
            .then(() => session.end());
        } else {
          Tools.handleUserError(
            message,
            "Only the game leader can end the game."
          );
        }
        break;
    }
  }

  // Typing (?)
  announce(message: string): Promise<Message> {
    return this.channel.send(message);
  }

  registerGame<T extends GameSession<any>>(game: {
    new (hub: GameHub, ...args: any[]): T;
    config: typeof GameSession["config"];
  }) {
    const { config } = game;
    const { emoji, name } = config;

    if (this.games[emoji]) {
      throw new Error(`A game with the emoji ${emoji} was already registered.`);
    }

    const validator = new ConfiguratorValidator();
    try {
      validator.validateConfig(config.configuration);
    } catch (e) {
      if (e instanceof Error) {
        console.error(
          `Game ${name} has an invalid configuration: "${e.message}"`
        );
      } else {
        console.error(`Error registering game ${name}! Error was `, e);
      }
      return;
    }

    this.games[emoji] = {
      clazz: game,
      name: name,
    };
  }

  buildEmbed(authorId: Snowflake): string | MessageEmbed {
    const activeSession = this.findPlayerSession(authorId);
    if (activeSession) {
      return "You are already in a game and can't start a new one!";
    }

    const embed = new MessageEmbed();
    embed.setTitle("Available games");
    for (const emoji in this.games) {
      if (!this.games.hasOwnProperty(emoji)) {
        continue;
      }

      embed.addField(emoji, this.games[emoji].name, true);
    }

    return embed;
  }

  getEmojis(): string[] {
    return Object.keys(this.games);
  }

  async createChannel(config: Config, permissions: OverwriteResolvable[]) {
    const sameGameSessionCount = Object.values(this.sessions).filter(
      (session) => session instanceof config.clazz
    ).length;

    const channelName =
      config.name.replace(/\s+/g, "-") + "-" + (sameGameSessionCount + 1);
    const channel = await this.guild.channels.create(channelName, {
      parent: this.channel.parent,
    });

    await channel.permissionOverwrites.set(permissions);

    return channel;
  }

  async createVoiceChannel(config: Config, permissions: OverwriteResolvable[]) {
    const channelName = config.name;
    const channel = await this.guild.channels.create(channelName, {
      parent: this.channel.parent,
      type: "GUILD_VOICE",
    });

    await channel.permissionOverwrites.set(permissions);
    return channel;
  }

  async getPlayers(
    leaderId: Snowflake,
    session: GameSession<any>
  ): Promise<GuildMember[]> {
    const group = "👪";
    const everyone = "👐";
    const selectionMessage = await this.channel.send(
      `<@${leaderId}> do you want to play with a select group of people (${group}) or is everyone free to join you (${everyone})?`
    );

    const selection = await Tools.addVote(
      selectionMessage,
      [group, everyone],
      [leaderId],
      true,
      true
    );

    const emoji = selection.emoji.name;

    if (emoji === group) {
      const pingRequest = await this.channel.send(
        "Please ping the users you want to play with (users already in a game will not be able to join you)."
      );

      const filter = (message: Message) => message.author.id === leaderId;
      const messages = await this.channel.awaitMessages({
        filter,
        time: 60000,
        max: 1,
      });

      await pingRequest.delete();

      const message = messages.first();
      if (!message) {
        throw new Error("No response to ping request");
      }

      await message.delete();

      const users = message.mentions.members;
      if (!users || users.size < 1) {
        throw new Error("No mentions in message");
      }

      return [...users.values()];
    } else if (emoji === everyone) {
      return await session.signUp();
    }
  }

  async validateDms(players: GuildMember[]) {
    const safeDm = async (
      user: GuildMember,
      message: string
    ): Promise<boolean> => {
      try {
        const dm = await user.createDM();
        await dm.send(message);
        return true;
      } catch (e) {
        return false;
      }
    };
    // Map all players to a Promise<{ player, sendSuccess: bool }>
    const dmPromises = players.map((player) =>
      safeDm(player, "*Verifying that I can send you a message*").then(
        (sendSuccess) => ({ player, sendSuccess })
      )
    );
    // Use Promise.all to wait for all promises to return and access their values
    const dmResults = await Promise.all(dmPromises);
    // Filter through the results and collect all the players where the DM failed
    const failedPlayers = dmResults
      .filter(({ sendSuccess }) => !sendSuccess)
      .map(({ player }) => player);
    // Send a note in the game channel
    if (failedPlayers.length > 0) {
      const failedPings = failedPlayers
        .map((player) => `<@${player.id}>`)
        .join(", ");
      throw new Error(
        `I couldn't send DMs to the following players: ${failedPings} please check your privacy settings (both general and for this server) to make sure I can DM you.`
      );
    }
  }

  async createSession(emoji: string, leaderId: Snowflake) {
    const config = this.games[emoji];
    if (!config) {
      throw new Error("I couldn't find a configuration for the emoji " + emoji);
    }

    const session = new config.clazz(this);
    const clazz = session.constructor as typeof GameSession;

    let players;
    try {
      players = await this.getPlayers(leaderId, session);
      if (!players.map((p) => p.id).includes(leaderId)) {
        players.push(this.guild.members.resolve(leaderId));
      }

      const { minPlayers, maxPlayers } = clazz.config;
      if (minPlayers && players.length < minPlayers) {
        // noinspection ExceptionCaughtLocallyJS
        throw new Error(
          `Not enough players! You need at least ${minPlayers} people.`
        );
      }

      if (clazz.config.dmsRequired) await this.validateDms(players);

      if (maxPlayers && players.length > maxPlayers) {
        // noinspection ExceptionCaughtLocallyJS
        throw new Error(
          `Too many players! Allowed: ${maxPlayers}, but you are ${players.length}.`
        );
      }
    } catch (e) {
      throw e;
    }

    const minPlayers = clazz.config.minPlayers;
    const cleanedPlayers = await this.cleanPlayers(players);
    const playerPing = cleanedPlayers
      .map((member) => `<@${member.user.id}>`)
      .join(" ");

    if (cleanedPlayers.length < minPlayers) {
      throw new Error(
        `Not enough players! You need at least ${minPlayers} people. Please make sure no players are in an ongoing game.`
      );
    }

    const permissions = this.getChannelPermissions(cleanedPlayers);
    const channel = await this.createChannel(config, permissions);
    let maybeVoiceChannel;

    if (clazz.config.voiceRequired) {
      maybeVoiceChannel = await this.createVoiceChannel(config, permissions);
    }

    await channel.send(
      `**${playerPing}, welcome to a game of ${config.name}!**`
    );

    if (maybeVoiceChannel) {
      await channel.send(
        "I created a voice channel for you that you should be able to see in the Bot Games category"
      );
    }

    session.setBaseConfiguration(
      channel,
      cleanedPlayers,
      leaderId,
      maybeVoiceChannel
    );
    this.sessions[channel.id] = session;

    if (clazz.config.configuration) {
      await channel.send(
        `<@${leaderId}> is game leader, please configure the game!`
      );

      const configurator = new GameConfigurator(
        clazz.config.configuration,
        config.name,
        leaderId,
        channel
      );
      const gameConfig = await configurator.createConfiguration();
      await session.patchConfig(gameConfig);
    }

    session.start();
  }

  // Because of the way we "route" DMs to the game sessions, members may only be in a single session at once.
  // This function takes an array of players that signed up, filters out those who are already in an active session,
  //  sends a message why they were not allowed in, and returns a Promise of all players not in an active session.
  async cleanPlayers(players: GuildMember[]): Promise<GuildMember[]> {
    const playersWithSession = players
      .map((player) => ({
        player,
        session: this.findPlayerSession(player.id),
      }))
      .filter(({ session, player }) => session && !player.user.bot);

    const deniedMessage = playersWithSession
      .map(({ player, session }) => {
        const sessionClass = session.constructor as typeof GameSession;
        return `<@${player.id}>, your signup was invalidated because you are already playing a game of ${sessionClass.config.name}`;
      })
      .join("\n");

    if (deniedMessage.length > 0) {
      await this.channel.send(deniedMessage);
    }

    const blockedIds = playersWithSession.map(({ player }) => player.id);
    return players.filter((player) => !blockedIds.includes(player.id));
  }

  async closeSession<T extends GameSession<any>>(session: T) {
    delete this.sessions[session.channel.id];
    setTimeout(() => {
      session.channel.delete();
      session.voiceChannel?.delete();
    }, 60 * 1000);
  }

  public routeMessage(message: Message) {
    if (message.channel.type === "DM") {
      this.routeDMMessage(message);
      return;
    }

    const channelId = message.channel.id;
    // Ignore bot messages and messages sent in the hub's base channel when routing
    if (message.author.bot || channelId === this.channel.id) {
      return;
    }

    const session = this.sessions[channelId];
    if (!session) {
      return;
    }

    const command = message.content.split(" ")[0];
    if (generalCommands.includes(command)) {
      GameHub.handleGeneralCommand(command, session, message);
      return;
    }

    session.handleInput(message);
  }

  private getChannelPermissions(
    cleanedPlayers: GuildMember[]
  ): OverwriteResolvable[] {
    const support = Tools.getRoleByName("Support", this.guild);
    const playerPermissions: OverwriteResolvable[] = cleanedPlayers.map(
      (member) => ({
        id: member.user.id,
        allow: [
          Permissions.FLAGS.VIEW_CHANNEL,
          Permissions.FLAGS.SEND_MESSAGES,
          Permissions.FLAGS.CONNECT,
        ],
        type: "member",
      })
    );

    return [
      {
        id: this.guild.roles.everyone,
        allow: [],
        deny: [Permissions.FLAGS.VIEW_CHANNEL],
        type: "role",
      },
      {
        id: support,
        allow: [
          Permissions.FLAGS.VIEW_CHANNEL,
          Permissions.FLAGS.SEND_MESSAGES,
          Permissions.FLAGS.CONNECT,
        ],
        type: "role",
      },
      ...playerPermissions,
    ];
  }

  private routeDMMessage(message: Message) {
    const authorId = message.author.id;
    const sessionWithPlayer = this.findPlayerSession(authorId);
    if (!sessionWithPlayer) {
      return;
    }

    sessionWithPlayer.handleInput(message);
  }

  private findPlayerSession(playerId: Snowflake) {
    return Object.values(this.sessions).find((session) =>
      session.players.some((player) => player.id === playerId)
    );
  }
}
