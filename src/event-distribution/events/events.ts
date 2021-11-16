import {
  addMessageHandler,
  extractMessageInfo,
  MessageEventHandlerOptions,
  MessageHandlerFunction,
} from "./message";
import {
  AddEventHandlerFunction,
  BaseOptions,
  DiscordEvent,
  ExtractInfoFunction,
  MessageRelatedOptions,
} from "../types/base";
import {
  addReactionHandler,
  extractReactionInfo,
  ReactionEventHandlerOptions,
  ReactionHandlerFunction,
} from "./reactions";
import { StringIndexedHIOCTree } from "../types/hioc";
import {
  ButtonInteraction,
  Client,
  Message,
  MessageReaction,
  User,
  VoiceState,
} from "discord.js";
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
} from "./timer";
import {
  addMemberJoinHandler,
  extractMemberJoinInfo,
  MemberJoinArgument,
  MemberJoinEventHandlerOptions,
  MemberJoinHandlerFunction,
} from "./member-join";
import { Timer } from "@yes-theory-fam/database/client";
import { createYesBotLogger } from "../../log";
import Tools from "../../common/tools";
import {
  addButtonClickedHandler,
  ButtonClickedHandlerFunction,
  ButtonClickedHandlerOptions,
  extractButtonClickedInfo,
} from "./button-clicked";

export type EventHandlerOptions =
  | ButtonClickedHandlerOptions
  | MemberLeaveEventHandlerOptions
  | MessageEventHandlerOptions
  | ReactionEventHandlerOptions
  | ReadyEventHandlerOptions
  | GuildMemberUpdateEventHandlerOptions
  | TimerEventHandlerOptions
  | VoiceStateUpdateEventHandlerOptions
  | MemberJoinEventHandlerOptions;

export type HandlerFunction<T extends DiscordEvent> =
  | ButtonClickedHandlerFunction<T>
  | MemberLeaveHandlerFunction<T>
  | MessageHandlerFunction<T>
  | ReactionHandlerFunction<T>
  | ReadyHandlerFunction<T>
  | GuildMemberUpdateHandlerFunction<T>
  | TimerHandlerFunction<T>
  | VoiceStateHandlerFunction<T>
  | MemberJoinHandlerFunction<T>;

const logger = createYesBotLogger("event-distribution", "events");

export const isMessageRelated = (
  options: BaseOptions
): options is MessageRelatedOptions =>
  options.event === DiscordEvent.MESSAGE ||
  options.event === DiscordEvent.REACTION_ADD ||
  options.event === DiscordEvent.REACTION_REMOVE ||
  options.event === DiscordEvent.BUTTON_CLICKED;

export const addEventHandler: AddEventHandlerFunction<EventHandlerOptions> = (
  options,
  ioc,
  tree
) => {
  switch (options.event) {
    case DiscordEvent.BUTTON_CLICKED:
      return addButtonClickedHandler(
        options,
        ioc,
        tree as StringIndexedHIOCTree<DiscordEvent.BUTTON_CLICKED>
      );
    case DiscordEvent.MEMBER_LEAVE:
      return addMemberLeaveHandler(
        options,
        ioc,
        tree as StringIndexedHIOCTree<DiscordEvent.MEMBER_LEAVE>
      );
    case DiscordEvent.MEMBER_JOIN:
      return addMemberJoinHandler(
        options,
        ioc,
        tree as StringIndexedHIOCTree<DiscordEvent.MEMBER_JOIN>
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
      case DiscordEvent.BUTTON_CLICKED:
        return extractButtonClickedInfo(args[0] as ButtonInteraction);
      case DiscordEvent.MEMBER_LEAVE:
        return extractMemberLeaveInfo(args[0] as MemberLeaveArgument);
      case DiscordEvent.MEMBER_JOIN:
        return extractMemberJoinInfo(args[0] as MemberJoinArgument);
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

export const rejectWithMessage = async (
  message: string,
  event: DiscordEvent,
  ...args: Parameters<HandlerFunction<DiscordEvent>>
): Promise<unknown> => {
  switch (event) {
    case DiscordEvent.MESSAGE:
      const messageArg = args[0] as Message;
      const channelResolvedMessage = Tools.resolveChannelNamesInString(
        message,
        messageArg.guild
      );
      return await Tools.handleUserError(messageArg, channelResolvedMessage);
    default:
      logger.error(
        `Tried to reject event ${event} with message: ${message} but rejection isn't implemented for this event.`
      );
  }
};
