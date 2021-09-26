import {
  AddEventHandlerFunction,
  BaseOptions,
  DiscordEvent,
  ExtractInfoForEventFunction,
  HandlerFunctionFor,
} from "../types/base";
import {
  DMChannel,
  GuildChannel,
  MessageReaction,
  NewsChannel,
  PartialUser,
  TextChannel,
  User,
} from "discord.js";
import { addToTree, getIdFromCategoryName } from "../helper";

export interface ReactionEventHandlerOptions extends BaseOptions {
  emoji: string;
  event: DiscordEvent.REACTION_ADD | DiscordEvent.REACTION_REMOVE;
}

export type ReactionHandlerFunction<T extends DiscordEvent> =
  HandlerFunctionFor<
    T,
    DiscordEvent.REACTION_ADD | DiscordEvent.REACTION_REMOVE,
    [MessageReaction, User | PartialUser]
  >;

export const addReactionHandler: AddEventHandlerFunction<ReactionEventHandlerOptions> =
  (options, ioc, tree) => {
    const channels = options.channelNames ?? [];
    const categories = options.categoryNames ?? [];
    if (channels.length === 0 && categories.length === 0) channels.push("");

    const emoji = options.emoji ?? "";

    const combinedChannels = [
      ...channels,
      ...categories.map((c) => getIdFromCategoryName(c)),
    ];

    for (const channel of combinedChannels) {
      addToTree([channel, emoji], { options, ioc }, tree);
    }
  };

export const extractReactionInfo: ExtractInfoForEventFunction<
  DiscordEvent.REACTION_ADD | DiscordEvent.REACTION_REMOVE
> = (reaction, user) => {
  const getChannelIdentifier = (
    channel: TextChannel | DMChannel | NewsChannel
  ) => (channel.type === "dm" ? channel.id : channel.name);

  const message = reaction.message;
  const channel = message.channel;
  const guild = channel.type === "dm" ? null : channel.guild;
  const member = guild?.member(user.id) ?? null;

  const channelIdentifier = getChannelIdentifier(channel);

  const baseInfo = {
    member,
    isDirectMessage: reaction.message.channel.type === "dm",
  };

  const info = [
    {
      ...baseInfo,
      handlerKeys: [channelIdentifier, reaction.emoji.name],
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
      handlerKeys: [categoryIdentifier, reaction.emoji.name],
    });
  }

  return info;
};
