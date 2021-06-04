import { EventHandlerOptions, HandlerFunction } from "../events";
import { User } from "discord.js";
import { CommandHandler } from "./handler";
import { InstanceOrConstructor, StringIndexedHIOCTree } from "./hioc";

export const enum DiscordEvent {
  MESSAGE = "MESSAGE",
  REACTION_ADD = "REACTION_ADD",
  REACTION_REMOVE = "REACTION_REMOVE",
}

export const enum MessageLocation {
  SERVER = "SERVER",
  DM = "DM",
  ANYWHERE = "ANYWHERE",
}

export interface BaseOptions {
  event: DiscordEvent;
  stateful?: boolean;
  description: string;
  requiredRoles?: string[];
  channelNames?: string[];
  location?: MessageLocation;
}

type VoidFunctionWithArgs<T> = T extends any[]
  ? (...args: T) => void
  : (arg: T) => void;

export type HandlerFunctionFor<
  Event extends DiscordEvent,
  TargetEvent extends DiscordEvent,
  VoidFunctionArgs
> = Event extends TargetEvent ? VoidFunctionWithArgs<VoidFunctionArgs> : never;

export interface HandlerInfo {
  handlerKeys: string[];
  user: User;
  isDm: boolean;
}

export type ExtractInfoFunction<T extends DiscordEvent> = (
  event: T,
  ...args: Parameters<HandlerFunction<T>>
) => HandlerInfo;

export type ExtractInfoForEventFunction<T extends DiscordEvent> = (
  ...args: Parameters<HandlerFunction<T>>
) => HandlerInfo;

export type AddEventHandlerFunction<T extends EventHandlerOptions> = (
  options: T,
  ioc: InstanceOrConstructor<CommandHandler<T["event"]>>,
  tree: StringIndexedHIOCTree<T["event"]>
) => void;
