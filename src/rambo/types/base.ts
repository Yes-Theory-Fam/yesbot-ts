import { EventHandlerOptions, HandlerFunction } from "../events";
import { User } from "discord.js";
import { CommandHandler } from "../common/handler";
import { InstanceOrConstructor, StringIndexedHIOCTree } from "./hioc";

export const enum DiscordEvent {
  MESSAGE = "MESSAGE",
  REACTION_ADD = "REACTION_ADD",
  REACTION_REMOVE = "REACTION_REMOVE",
  // GUILD_MEMBER_UPDATE = "GUILD_MEMBER_UPDATE",
  // MEMBER_JOIN = "MEMBER_JOIN",
  // MEMBER_LEAVE = "MEMBER_LEAVE",
  // READY = "READY",
  // VOICE_STATE_UPDATE = "VOICE_STATE_UPDATE",
}

export interface BaseOptions {
  event: DiscordEvent;
  stateful?: boolean;
  description: string;
  requiredRoles?: string[];
  channelNames?: string[];
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
