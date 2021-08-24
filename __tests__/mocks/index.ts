import Discord, {
  Channel,
  Client,
  Guild,
  GuildChannel,
  GuildMember,
  Message,
  MessageReaction,
  Role,
  TextChannel,
  User,
  VoiceState,
} from "discord.js";
import {
  APIUser,
  APIGuildMember,
  ChannelType,
  MessageType,
} from "discord-api-types";
import { MockMessage } from "./message";
import { MockMessageReaction } from "./reaction";
import { MockGuild } from "./guild";
import { MockGuildMember } from "./guildmember";

type Writeable<T> = { -readonly [P in keyof T]: T[P] };

export default class MockDiscord {
  public message!: Message;
  public messageReaction!: MessageReaction;
  private client!: Client;
  private guild!: MockGuild;
  private channel!: Channel;
  private guildChannel!: GuildChannel;
  private textChannel!: TextChannel;
  private user!: User;
  private guildMember!: GuildMember;
  private role!: Role;
  private voiceState!: VoiceState;

  constructor() {
    this.mockClient();
    this.mockGuild();
    this.mockChannel();
    this.mockGuildChannel();
    this.mockTextChannel();
    this.mockUser();
    this.mockGuildMember();
    this.addMember();
    this.mockMessage();
    this.mockMessageReaction();
    this.mockRole();
    this.mockVoiceState();
  }

  public getClient(): Client {
    return this.client;
  }

  public getGuild(): Guild {
    return this.guild;
  }

  public getChannel(): Channel {
    return this.channel;
  }

  public getGuildChannel(): GuildChannel {
    return this.guildChannel;
  }

  public getTextChannel(): TextChannel {
    return this.textChannel;
  }

  public getUser(): User {
    return this.user;
  }

  public getGuildMember(): GuildMember {
    return this.guildMember;
  }

  public getMessage(): Message {
    return this.message;
  }

  public getMessageReaction(): MessageReaction {
    return this.messageReaction;
  }

  public getRole(): Role {
    return this.role;
  }

  public getVoiceState(): Writeable<VoiceState> {
    return this.voiceState;
  }

  private addMember = () => {
    this.guild.addMember(this.guildMember);
  };

  private mockClient(): void {
    this.client = new Discord.Client({ intents: [], restSweepInterval: 0 });

    this.client.users.fetch = jest.fn(() => Promise.resolve(this.getUser()));
    this.client.login = jest.fn(() => Promise.resolve("LOGIN_TOKEN"));
    this.client.token = process.env.BOT_TOKEN;
  }

  private mockGuild(): void {
    this.guild = new MockGuild(this.client, {
      unavailable: false,
      id: "guild-id",
      name: "mocked js guild",
      icon: "mocked guild icon url",
      splash: "mocked guild splash url",
      region: "eu-west",
      member_count: 42,
      large: false,
      features: [],
      application_id: "application-id",
      afk_timeout: 1000,
      afk_channel_id: "afk-channel-id",
      system_channel_id: "system-channel-id",
      verification_level: 2,
      explicit_content_filter: 3,
      mfa_level: 8,
      joined_at: new Date("2018-01-01").getTime().toString(),
      owner_id: "owner-id",
      channels: [],
      roles: [],
      presences: [],
      voice_states: [],
      emojis: [],
    });
  }

  private mockChannel(): void {
    this.channel = new Channel(this.client, {
      id: "channel-id",
      name: "Frank",
      type: ChannelType.GuildText,
    });
  }

  private mockGuildChannel(): void {
    this.guildChannel = new GuildChannel(this.guild, {
      ...this.channel,

      type: ChannelType.GuildText,
      name: "guild-channel",
      position: 1,
      parent_id: "123456789",
      permission_overwrites: [],
    });
  }

  private mockTextChannel(): void {
    this.textChannel = new TextChannel(this.guild, {
      ...this.guildChannel,

      type: ChannelType.GuildText,
      topic: "topic",
      nsfw: false,
      last_message_id: "123456789",
      last_pin_timestamp: new Date("2019-01-01").getTime().toString(),
      rate_limit_per_user: 0,
    });
  }

  private mockUser(): void {
    this.user = new User(this.client, {
      id: "222222222222222200",
      username: "user username",
      discriminator: "user#0000",
      avatar: "user avatar url",
      bot: false,
    });
  }

  private apiUser(): APIUser {
    return {
      ...this.user,
      flags: undefined,
    };
  }

  private apiMember(): APIGuildMember {
    return {
      deaf: false,
      mute: false,
      nick: "nick",
      joined_at: new Date("2020-01-01").getTime().toString(),
      user: this.apiUser(),
      roles: [],
    };
  }

  private mockGuildMember(): void {
    this.guildMember = new MockGuildMember(
      this.client,
      this.apiMember(),
      this.guild
    );
  }

  private mockMessage(): void {
    this.message = new MockMessage(
      this.textChannel,
      this.guildMember,
      this.client,
      {
        id: "message-id",
        channel_id: this.channel.id,
        type: MessageType.Default,
        content: "this is the message content",
        author: this.apiUser(),
        webhook_id: null,
        member: this.apiMember(),
        pinned: false,
        tts: false,
        nonce: "nonce",
        embeds: [],
        attachments: [],
        edited_timestamp: null,
        reactions: [],
        mentions: [],
        mention_roles: [],
        mention_everyone: false,
        timestamp: "",
      }
    );
  }

  private mockMessageReaction(): void {
    this.messageReaction = new MockMessageReaction(
      this.guildMember,
      this.client,
      {
        count: 1,
        me: true,
        emoji: {
          id: null,
          animated: false,
          name: undefined,
        },
        channel_id: this.channel.id,
      },
      this.message
    );
  }

  private mockRole() {
    this.role = new Role(
      this.client,
      {
        id: "",
        name: "Jeremy",
        color: 0xffff00,
        hoist: false,
        position: 42,
        mentionable: false,
        managed: false,
        permissions: "",
      },
      this.guild
    );
  }

  private mockVoiceState() {
    this.voiceState = new VoiceState(this.guild, {
      deaf: false,
      mute: false,
      suppress: false,
      channel_id: this.channel.id,
      user_id: this.user.id,
      session_id: "",
      self_deaf: false,
      self_mute: false,
      self_video: true,
      request_to_speak_timestamp: null,
    });
  }
}
