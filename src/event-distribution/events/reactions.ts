import {
  AddEventHandlerFunction,
  DiscordEvent,
  ExtractInfoForEventFunction,
  HandlerFunctionFor,
  MessageRelatedOptions,
} from "../types/base";
import {
  GuildChannel,
  MessageReaction,
  PartialMessageReaction,
  PartialUser,
  TextBasedChannels,
  User,
} from "discord.js";
import { addToTree, getIdFromCategoryName } from "../helper";

export interface ReactionEventHandlerOptions extends MessageRelatedOptions {
  emoji: string;
  event: DiscordEvent.REACTION_ADD | DiscordEvent.REACTION_REMOVE;
}

export type ReactionHandlerFunction<T extends DiscordEvent> =
  HandlerFunctionFor<
    T,
    DiscordEvent.REACTION_ADD | DiscordEvent.REACTION_REMOVE,
    [MessageReaction | PartialMessageReaction, User | PartialUser]
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
  const getChannelIdentifier = (channel: TextBasedChannels) =>
    channel.type === "DM" ? channel.id : channel.name;

  const message = reaction.message;
  const channel = message.channel;
  const guild = channel.type === "DM" ? null : channel.guild;
  const member = guild?.members.resolve(user.id) ?? null;

  const channelIdentifier = getChannelIdentifier(channel);

  const baseInfo = {
    member,
    isDirectMessage: reaction.message.channel.type === "DM",
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
