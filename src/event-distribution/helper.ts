import {
  CommandHandler,
  DiscordEvent,
  HandlerInfo,
  MessageRelatedOptions,
} from ".";
import {
  HIOC,
  InstanceOrConstructor,
  StringIndexedHIOCTree,
} from "./types/hioc";
import {
  GuildChannel,
  GuildMember,
  Message,
  PartialMessage,
  TextBasedChannel,
} from "discord.js";

export const getIdFromCategoryName = (name: string) =>
  `c_${name.toLowerCase()}`;

export const getIocName = <T extends DiscordEvent>(
  ioc: InstanceOrConstructor<CommandHandler<T>>
) => {
  return typeof ioc === "function" ? ioc.name : ioc.constructor.name;
};

export const collectChannelDefinitions = (options: MessageRelatedOptions) => {
  const channels = options.channelNames ?? [];
  const categories = options.categoryNames ?? [];
  if (channels.length === 0 && categories.length === 0) channels.push("");

  return [...channels, ...categories.map((c) => getIdFromCategoryName(c))];
};

type HandlerKeyFromChannelIdResolver = (channelIdentifier: string) => string[];

export const withMessageRelatedInfo = (
  message: Message | PartialMessage,
  member: GuildMember | null,
  resolver: HandlerKeyFromChannelIdResolver
): HandlerInfo[] => {
  const getChannelIdentifier = (channel: TextBasedChannel) =>
    channel.type === "DM" ? channel.id : channel.name;

  const channel = message.channel;
  const channelIdentifier = getChannelIdentifier(channel);

  const baseInfo = {
    member: member,
    isDirectMessage: message.channel.type === "DM",
  };

  const info = [
    {
      ...baseInfo,
      handlerKeys: resolver(channelIdentifier),
    },
  ];

  const maybeCategory = (channel as GuildChannel).parent;
  if (maybeCategory) {
    const normalizedCategoryName = maybeCategory.name
      .match(/[a-z\d\s.]+/gi)[0]
      .trim();
    const categoryIdentifier = getIdFromCategoryName(normalizedCategoryName);

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
