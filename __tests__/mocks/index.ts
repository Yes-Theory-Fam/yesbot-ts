import Discord, {
  Channel,
  Client,
  ClientUser,
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
import { GuildMock, MockGuild } from "./guild";
import { MockGuildMember } from "./guildmember";
import { RawUserData } from "discord.js/typings/rawDataTypes";

type Writeable<T> = { -readonly [P in keyof T]: T[P] };

// In some minor update, Discord.JS uses BigInt internally disallowing arbitrary strings for ids
const idString = "9007199254740991";

export default class MockDiscord {
  public message!: Message;
  public messageReaction!: MessageReaction;
  private client!: Client;
  private guild!: GuildMock;
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

  private rawUserData: RawUserData = {
    id: idString,
    username: "user username",
    discriminator: "user#0000",
    avatar: "user avatar url",
    bot: false,
  };

  private mockClient(): void {
    this.client = new Discord.Client({ intents: [], restSweepInterval: 0 });

    this.client.users.fetch = jest.fn(() => Promise.resolve(this.getUser()));
    this.client.user = Reflect.construct(ClientUser, [
      this.client,
      {
        ...this.rawUserData,
        bot: true,
      },
    ]);
    this.client.user.id = idString;

    this.client.login = jest.fn(() => Promise.resolve("LOGIN_TOKEN"));
    this.client.token = process.env.BOT_TOKEN;
  }

  private mockGuild(): void {
    this.guild = MockGuild.new(this.client, {
      unavailable: false,
      id: idString,
      name: "mocked js guild",
      icon: "mocked guild icon url",
      splash: "mocked guild splash url",
      region: "eu-west",
      member_count: 42,
      large: false,
      features: [],
      application_id: idString,
      afk_timeout: 1000,
      afk_channel_id: idString,
      system_channel_id: idString,
      verification_level: 2,
      explicit_content_filter: 3,
      mfa_level: 8,
      joined_at: new Date("2018-01-01").getTime().toString(),
      owner_id: idString,
      channels: [],
      roles: [],
      presences: [],
      voice_states: [],
      emojis: [],
    });
  }

  private mockChannel(): void {
    this.channel = Reflect.construct(Channel, [
      this.client,
      {
        id: idString,
        name: "Frank",
        type: ChannelType.GuildText,
      },
    ]);
  }

  private mockGuildChannel(): void {
    this.guildChannel = Reflect.construct(GuildChannel, [
      this.guild,
      {
        ...this.channel,

        type: ChannelType.GuildText,
        name: idString,
        position: 1,
        parent_id: idString,
        permission_overwrites: [],
      },
    ]);
  }

  private mockTextChannel(): void {
    this.textChannel = Reflect.construct(TextChannel, [
      this.guild,
      {
        ...this.guildChannel,

        type: ChannelType.GuildText,
        topic: "topic",
        nsfw: false,
        last_message_id: idString,
        last_pin_timestamp: new Date("2019-01-01").getTime().toString(),
        rate_limit_per_user: 0,
      },
    ]);
  }

  private mockUser(): void {
    this.user = Reflect.construct(User, [this.client, this.rawUserData]);
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
    this.guildMember = MockGuildMember.new(
      this.client,
      this.apiMember(),
      this.guild
    );
  }

  private mockMessage(): void {
    this.message = MockMessage.new(
      this.textChannel,
      this.guildMember,
      this.client,
      {
        id: idString,
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
    this.messageReaction = MockMessageReaction.new(
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
    this.role = Reflect.construct(Role, [
      this.client,
      {
        id: idString,
        name: "Jeremy",
        color: 0xffff00,
        hoist: false,
        position: 42,
        mentionable: false,
        managed: false,
        permissions: "",
      },
      this.guild,
    ]);
  }

  private mockVoiceState() {
    this.voiceState = Reflect.construct(VoiceState, [
      this.guild,
      {
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
      },
    ]);
  }
}
