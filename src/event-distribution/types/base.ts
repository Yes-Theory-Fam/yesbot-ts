import { EventHandlerOptions, HandlerFunction } from "../events/events";
import { GuildMember, PartialGuildMember } from "discord.js";
import { CommandHandler } from "./handler";
import { InstanceOrConstructor, StringIndexedHIOCTree } from "./hioc";

export const enum DiscordEvent {
  GUILD_MEMBER_UPDATE = "GUILD_MEMBER_UPDATE",
  MESSAGE = "MESSAGE",
  REACTION_ADD = "REACTION_ADD",
  REACTION_REMOVE = "REACTION_REMOVE",
  READY = "READY",
  VOICE_STATE_UPDATE = "VOICE_STATE_UPDATE",
}

export const enum EventLocation {
  SERVER = "SERVER",
  DIRECT_MESSAGE = "DIRECT_MESSAGE",
  ANYWHERE = "ANYWHERE",
}

export interface BaseOptions {
  event: DiscordEvent;
  stateful?: boolean;
  description: string;
  requiredRoles?: string[];
  channelNames?: string[];
  location?: EventLocation;
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
  member?: GuildMember | PartialGuildMember;
  isDirectMessage: boolean;
}

export type ExtractInfoFunction<T extends DiscordEvent> = (
  event: T,
  ...args: Parameters<HandlerFunction<T>>
) => HandlerInfo[];

export type ExtractInfoForEventFunction<T extends DiscordEvent> = (
  ...args: Parameters<HandlerFunction<T>>
) => HandlerInfo | HandlerInfo[];

export type AddEventHandlerFunction<T extends EventHandlerOptions> = (
  options: T,
  ioc: InstanceOrConstructor<CommandHandler<T["event"]>>,
  tree: StringIndexedHIOCTree<T["event"]>
) => void;
