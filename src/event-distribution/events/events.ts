import {
  addMessageHandler,
  extractMessageInfo,
  MessageEventHandlerOptions,
  MessageHandlerFunction,
} from "./message";
import {
  AddEventHandlerFunction,
  DiscordEvent,
  ExtractInfoFunction,
} from "../types/base";
import {
  addReactionHandler,
  extractReactionInfo,
  ReactionEventHandlerOptions,
  ReactionHandlerFunction,
} from "./reactions";
import { StringIndexedHIOCTree } from "../types/hioc";
import { Message, MessageReaction, User } from "discord.js";
import { CommandHandler } from "../types/handler";

export type EventHandlerOptions =
  | MessageEventHandlerOptions
  | ReactionEventHandlerOptions;

export type HandlerFunction<T extends DiscordEvent> =
  | MessageHandlerFunction<T>
  | ReactionHandlerFunction<T>;

export const addEventHandler: AddEventHandlerFunction<EventHandlerOptions> = (
  options: MessageEventHandlerOptions | ReactionEventHandlerOptions,
  ioc:
    | {
        new (...args: any[]): CommandHandler<
          (MessageEventHandlerOptions | ReactionEventHandlerOptions)["event"]
        >;
        prototype: any;
      }
    | CommandHandler<
        (MessageEventHandlerOptions | ReactionEventHandlerOptions)["event"]
      >,
  tree: StringIndexedHIOCTree<
    | DiscordEvent.MESSAGE
    | DiscordEvent.REACTION_ADD
    | DiscordEvent.REACTION_REMOVE
  >
) => {
  switch (options.event) {
    case DiscordEvent.MESSAGE:
      return addMessageHandler(
        options,
        ioc,
        tree as StringIndexedHIOCTree<DiscordEvent.MESSAGE>
      );
    case DiscordEvent.REACTION_ADD:
    case DiscordEvent.REACTION_REMOVE:
      return addReactionHandler(
        options,
        ioc,
        tree as StringIndexedHIOCTree<
          DiscordEvent.REACTION_ADD | DiscordEvent.REACTION_REMOVE
        >
      );
  }
};

export const extractEventInfo: ExtractInfoFunction<DiscordEvent> = (
  event,
  ...args
) => {
  switch (event) {
    case DiscordEvent.MESSAGE:
      return extractMessageInfo(args[0] as Message);
    case DiscordEvent.REACTION_ADD:
    case DiscordEvent.REACTION_REMOVE:
      return extractReactionInfo(args[0] as MessageReaction, args[1] as User);
    default:
      throw new Error("Could not extract info for event " + event);
  }
};
