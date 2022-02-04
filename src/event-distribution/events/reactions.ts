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
  TextBasedChannel,
  User,
} from "discord.js";
import {
  addToTree,
  collectChannelDefinitions,
  getIdFromCategoryName,
  withMessageRelatedInfo,
} from "../helper";

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

export const addReactionHandler: AddEventHandlerFunction<
  ReactionEventHandlerOptions
> = (options, ioc, tree) => {
  const combinedChannels = collectChannelDefinitions(options);
  const emoji = options.emoji ?? "";

  for (const channel of combinedChannels) {
    addToTree([channel, emoji], { options, ioc }, tree);
  }
};

export const extractReactionInfo: ExtractInfoForEventFunction<
  DiscordEvent.REACTION_ADD | DiscordEvent.REACTION_REMOVE
> = (reaction, user) => {
  const channel = reaction.message.channel;
  const guild = channel.type === "DM" ? null : channel.guild;
  const member = guild?.members.resolve(user.id) ?? null;

  return withMessageRelatedInfo(reaction.message, member, (channelId) => [
    channelId,
    reaction.emoji.name,
  ]);
};
