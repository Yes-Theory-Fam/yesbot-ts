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
import { Client, Message, MessageReaction, User, VoiceState } from "discord.js";
import {
  addGuildMemberUpdateHandler,
  extractGuildMemberUpdateInfo,
  GuildMemberUpdateArgument,
  GuildMemberUpdateEventHandlerOptions,
  GuildMemberUpdateHandlerFunction,
} from "./guild-member-update";
import {
  addReadyHandler,
  extractReadyInfo,
  ReadyEventHandlerOptions,
  ReadyHandlerFunction,
} from "./ready";
import {
  addMemberLeaveHandler,
  extractMemberLeaveInfo,
  MemberLeaveArgument,
  MemberLeaveEventHandlerOptions,
  MemberLeaveHandlerFunction,
} from "./member-leave";
import {
  addVoiceStateUpdateHandler,
  extractVoiceStateUpdateInfo,
  VoiceStateHandlerFunction,
  VoiceStateUpdateEventHandlerOptions,
} from "./voice-state-update";
import {
  addTimerHandler,
  extractTimerInfo,
  TimerEventHandlerOptions,
  TimerHandlerFunction,
} from "../../events/timer";
import { Prisma, Timer } from "@yes-theory-fam/database/client";

export type EventHandlerOptions =
  | MemberLeaveEventHandlerOptions
  | MessageEventHandlerOptions
  | ReactionEventHandlerOptions
  | ReadyEventHandlerOptions
  | GuildMemberUpdateEventHandlerOptions
  | TimerEventHandlerOptions
  | VoiceStateUpdateEventHandlerOptions;

export type HandlerFunction<T extends DiscordEvent> =
  | MemberLeaveHandlerFunction<T>
  | MessageHandlerFunction<T>
  | ReactionHandlerFunction<T>
  | ReadyHandlerFunction<T>
  | GuildMemberUpdateHandlerFunction<T>
  | TimerHandlerFunction<T>
  | VoiceStateHandlerFunction<T>;

export const addEventHandler: AddEventHandlerFunction<EventHandlerOptions> = (
  options,
  ioc,
  tree
) => {
  switch (options.event) {
    case DiscordEvent.MEMBER_LEAVE:
      return addMemberLeaveHandler(
        options,
        ioc,
        tree as StringIndexedHIOCTree<DiscordEvent.MEMBER_LEAVE>
      );
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
    case DiscordEvent.GUILD_MEMBER_UPDATE:
      return addGuildMemberUpdateHandler(
        options,
        ioc,
        tree as StringIndexedHIOCTree<DiscordEvent.GUILD_MEMBER_UPDATE>
      );
    case DiscordEvent.READY:
      return addReadyHandler(
        options,
        ioc,
        tree as StringIndexedHIOCTree<DiscordEvent.READY>
      );
    case DiscordEvent.TIMER:
      return addTimerHandler(
        options,
        ioc,
        tree as StringIndexedHIOCTree<DiscordEvent.TIMER>
      );
    case DiscordEvent.VOICE_STATE_UPDATE:
      return addVoiceStateUpdateHandler(
        options,
        ioc,
        tree as StringIndexedHIOCTree<DiscordEvent.VOICE_STATE_UPDATE>
      );
  }
};

export const extractEventInfo: ExtractInfoFunction<DiscordEvent> = (
  event,
  ...args
) => {
  const getInfos = () => {
    switch (event) {
      case DiscordEvent.MEMBER_LEAVE:
        return extractMemberLeaveInfo(args[0] as MemberLeaveArgument);
      case DiscordEvent.MESSAGE:
        return extractMessageInfo(args[0] as Message);
      case DiscordEvent.REACTION_ADD:
      case DiscordEvent.REACTION_REMOVE:
        return extractReactionInfo(args[0] as MessageReaction, args[1] as User);
      case DiscordEvent.GUILD_MEMBER_UPDATE:
        return extractGuildMemberUpdateInfo(
          args[0] as GuildMemberUpdateArgument,
          args[1] as GuildMemberUpdateArgument
        );
      case DiscordEvent.READY:
        return extractReadyInfo(args[0] as Client);
      case DiscordEvent.TIMER:
        return extractTimerInfo(args[0] as Timer);
      case DiscordEvent.VOICE_STATE_UPDATE:
        return extractVoiceStateUpdateInfo(
          args[0] as VoiceState,
          args[1] as VoiceState
        );
      default:
        throw new Error("Could not extract info for event " + event);
    }
  };
  const infos = getInfos();

  return Array.isArray(infos) ? infos : [infos];
};
