import {
  CommandHandler,
  DiscordEvent,
  HandlerInfo,
  MessageRelatedOptions,
} from "./index.js";
import {
  HIOC,
  InstanceOrConstructor,
  StringIndexedHIOCTree,
} from "./types/hioc.js";
import {
  ChannelType,
  Client,
  Guild,
  GuildChannel,
  GuildMember,
  Message,
  PartialMessage,
  TextBasedChannel,
} from "discord.js";
import { APIGuildMember } from "discord-api-types/v10";
import { EventHandlerOptions } from "./events/events.js";

export const getIdFromParentName = (name: string) => `c_${name.toLowerCase()}`;

export const getIocName = <T extends DiscordEvent>(
  ioc: InstanceOrConstructor<CommandHandler<T>>
) => {
  return typeof ioc === "function" ? ioc.name : ioc.constructor.name;
};

export const collectChannelDefinitions = (options: MessageRelatedOptions) => {
  const channels = options.channelNames ?? [];
  const categories = options.parentNames ?? [];
  if (channels.length === 0 && categories.length === 0) channels.push("");

  return [...channels, ...categories.map((c) => getIdFromParentName(c))];
};

type HandlerKeyFromChannelIdResolver = (channelIdentifier: string) => string[];

export const withMessageRelatedInfo = (
  message: Message | PartialMessage,
  member: GuildMember | null,
  resolver: HandlerKeyFromChannelIdResolver
): HandlerInfo[] => {
  const getChannelIdentifier = (channel: TextBasedChannel) =>
    channel.isDMBased() ? channel.id : channel.name;

  const channel = message.channel;
  const channelIdentifier = getChannelIdentifier(channel);

  const baseInfo = {
    member: member,
    isDirectMessage: message.channel.type === ChannelType.DM,
    content: message.content,
  };

  const info = [
    {
      ...baseInfo,
      handlerKeys: resolver(channelIdentifier),
    },
  ];

  const maybeCategory = (channel as GuildChannel).parent;
  if (maybeCategory) {
    const normalizedCategoryName =
      maybeCategory.name.match(/[a-z\d\s-.]+/gi)?.[0].trim() ?? "";
    const categoryIdentifier = getIdFromParentName(normalizedCategoryName);

    info.push({
      ...baseInfo,
      handlerKeys: resolver(categoryIdentifier),
    });
  }

  return info;
};

export const addToTree = <T extends DiscordEvent>(
  keys: string[],
  hioc: HIOC<T>,
  tree: StringIndexedHIOCTree<T>
) => {
  if (keys.length === 1) {
    const [key] = keys;
    tree[key] ??= [];
    const handlers = tree[key] as HIOC<T>[];

    handlers.push(hioc);
    return;
  }

  const [key, ...rest] = keys;

  const subTree = tree[key];
  if (Array.isArray(subTree)) {
    tree[key] = { "": subTree };
  }

  tree[key] ??= {};
  addToTree(rest, hioc, tree[key] as StringIndexedHIOCTree<T>);
};

export const ensureGuildMemberOrNull = (
  member: GuildMember | APIGuildMember | null,
  client: Client,
  guild: Guild | null
): GuildMember | null => {
  if (!member) return null;

  if (member instanceof GuildMember) {
    return member;
  }

  if (!guild) {
    throw new Error(
      "Could not instantiate GuildMember from raw data; missing guild from button interaction"
    );
  }

  return Reflect.construct(GuildMember, [client, member, guild]) as GuildMember;
};

export const getAllOptions = <T extends DiscordEvent>(
  tree: StringIndexedHIOCTree<T>
): Extract<EventHandlerOptions, { event: T }>[] => {
  type ResultOptions = Extract<EventHandlerOptions, { event: T }>;

  let result: ResultOptions[] = [];

  for (const key in tree) {
    const node = tree[key];
    const toPush = Array.isArray(node)
      ? node.map<ResultOptions>((l) => l.options)
      : getAllOptions(node);
    result = [...result, ...toPush];
  }

  return result;
};
