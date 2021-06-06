import {
  AddEventHandlerFunction,
  BaseOptions,
  DiscordEvent,
  ExtractInfoForEventFunction,
  HandlerFunctionFor,
} from "../types/base";
import {
  DMChannel,
  MessageReaction,
  NewsChannel,
  TextChannel,
  User,
} from "discord.js";
import { HIOC, StringIndexedHIOCTree } from "../types/hioc";

export interface ReactionEventHandlerOptions extends BaseOptions {
  emoji: string;
  event: DiscordEvent.REACTION_ADD | DiscordEvent.REACTION_REMOVE;
}

export type ReactionHandlerFunction<T extends DiscordEvent> =
  HandlerFunctionFor<
    T,
    DiscordEvent.REACTION_ADD | DiscordEvent.REACTION_REMOVE,
    [MessageReaction, User]
  >;

export const addReactionHandler: AddEventHandlerFunction<ReactionEventHandlerOptions> =
  (options, ioc, tree) => {
    const channels = options.channelNames ?? [];
    if (channels.length === 0) channels.push("");

    const emoji = options.emoji ?? "";

    for (const channel of channels) {
      tree[channel] ??= {};
      const channelTree = tree[channel] as StringIndexedHIOCTree<
        DiscordEvent.REACTION_ADD | DiscordEvent.REACTION_REMOVE
      >;

      channelTree[emoji] ??= [];
      const emojiHiocs = channelTree[emoji] as HIOC<
        DiscordEvent.REACTION_ADD | DiscordEvent.REACTION_REMOVE
      >[];

      emojiHiocs.push({ ioc, options });
    }
  };

export const extractReactionInfo: ExtractInfoForEventFunction<
  DiscordEvent.REACTION_ADD | DiscordEvent.REACTION_REMOVE
> = (reaction, user) => {
  const getChannelIdentifier = (
    channel: TextChannel | DMChannel | NewsChannel
  ) => (channel.type === "dm" ? channel.id : channel.name);

  const channel = reaction.message.channel;
  const guild = channel.type === "dm" ? null : channel.guild;
  const member = guild?.member(user) ?? null;

  const channelIdentifier = getChannelIdentifier(channel);
  return {
    handlerKeys: [channelIdentifier, reaction.emoji.name],
    member,
    isDirectMessage: reaction.message.channel.type === "dm",
  };
};
