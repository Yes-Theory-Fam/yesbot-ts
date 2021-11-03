import { EventHandlerOptions, HandlerFunction } from "../events/events";
import { GuildMember, PartialGuildMember } from "discord.js";
import { CommandHandler } from "./handler";
import { InstanceOrConstructor, StringIndexedHIOCTree } from "./hioc";

export const enum DiscordEvent {
  BUTTON_CLICKED = "BUTTON_CLICKED",
  GUILD_MEMBER_UPDATE = "GUILD_MEMBER_UPDATE",
  MEMBER_LEAVE = "MEMBER_LEAVE",
  MESSAGE = "MESSAGE",
  REACTION_ADD = "REACTION_ADD",
  REACTION_REMOVE = "REACTION_REMOVE",
  READY = "READY",
  TIMER = "TIMER",
  VOICE_STATE_UPDATE = "VOICE_STATE_UPDATE",
  MEMBER_JOIN = "MEMBER_JOIN",
}

export const enum EventLocation {
  SERVER = "SERVER",
  DIRECT_MESSAGE = "DIRECT_MESSAGE",
  ANYWHERE = "ANYWHERE",
}

export const enum HandlerRejectedReason {
  MISSING_ROLE = "MISSING_ROLE",
  WRONG_LOCATION = "WRONG_LOCATION",
}

export interface BaseOptions {
  event: DiscordEvent;
  stateful?: boolean;
  errors?: Record<string, string>;
}

export interface MessageRelatedOptions extends BaseOptions {
  allowedRoles?: string[];
  channelNames?: string[];
  categoryNames?: string[];
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
