import { Timer } from "@prisma/client";
import {
  ButtonInteraction,
  ChatInputCommandInteraction,
  Client,
  Message,
  MessageContextMenuCommandInteraction,
  MessageReaction,
  RepliableInteraction,
  ThreadChannel,
  User,
  UserContextMenuCommandInteraction,
  VoiceState,
} from "discord.js";
import Tools from "../../common/tools.js";
import { createYesBotLogger } from "../../log.js";
import { ErrorDetailReplacer } from "../error-detail-replacer.js";
import {
  AddEventHandlerFunction,
  BaseOptions,
  DiscordEvent,
  ExtractInfoFunction,
  MessageRelatedOptions,
} from "../types/base.js";
import { StringIndexedHIOCTree } from "../types/hioc.js";
import {
  addButtonClickedHandler,
  ButtonClickedHandlerFunction,
  ButtonClickedHandlerOptions,
  extractButtonClickedInfo,
} from "./button-clicked.js";
import {
  addGuildMemberUpdateHandler,
  extractGuildMemberUpdateInfo,
  GuildMemberUpdateArgument,
  GuildMemberUpdateEventHandlerOptions,
  GuildMemberUpdateHandlerFunction,
} from "./guild-member-update.js";
import {
  addMemberJoinHandler,
  extractMemberJoinInfo,
  MemberJoinArgument,
  MemberJoinEventHandlerOptions,
  MemberJoinHandlerFunction,
} from "./member-join.js";
import {
  addMemberLeaveHandler,
  extractMemberLeaveInfo,
  MemberLeaveArgument,
  MemberLeaveEventHandlerOptions,
  MemberLeaveHandlerFunction,
} from "./member-leave.js";
import {
  addMessageHandler,
  extractMessageInfo,
  MessageEventHandlerOptions,
  MessageHandlerFunction,
} from "./message.js";
import {
  addReactionHandler,
  extractReactionInfo,
  ReactionEventHandlerOptions,
  ReactionHandlerFunction,
} from "./reactions.js";
import {
  addReadyHandler,
  extractReadyInfo,
  ReadyEventHandlerOptions,
  ReadyHandlerFunction,
} from "./ready.js";
import {
  addSlashCommandHandler,
  extractSlashCommandInfo,
  SlashCommandHandlerFunction,
  SlashCommandHandlerOptions,
} from "./slash-commands/index.js";
import {
  addThreadCreateHandler,
  extractThreadCreateInfo,
  ThreadCreatedHandlerFunction,
  ThreadCreateHandlerOptions,
} from "./thread-create.js";
import {
  addTimerHandler,
  extractTimerInfo,
  TimerEventHandlerOptions,
  TimerHandlerFunction,
} from "./timer.js";
import {
  addVoiceStateUpdateHandler,
  extractVoiceStateUpdateInfo,
  VoiceStateHandlerFunction,
  VoiceStateUpdateEventHandlerOptions,
} from "./voice-state-update.js";
import {
  addContextMenuMessageHandler,
  addContextMenuUserHandler,
  ContextMenuMessageHandlerFunction,
  ContextMenuMessageHandlerOptions,
  ContextMenuUserHandlerFunction,
  ContextMenuUserHandlerOptions,
  extractContextMenuMessageInfo,
  extractContextMenuUserInfo,
} from "./context-menu/index.js";

export type EventHandlerOptions =
  | ButtonClickedHandlerOptions
  | ContextMenuMessageHandlerOptions
  | ContextMenuUserHandlerOptions
  | MemberLeaveEventHandlerOptions
  | MessageEventHandlerOptions
  | ReactionEventHandlerOptions
  | ReadyEventHandlerOptions
  | GuildMemberUpdateEventHandlerOptions
  | SlashCommandHandlerOptions
  | ThreadCreateHandlerOptions
  | TimerEventHandlerOptions
  | VoiceStateUpdateEventHandlerOptions
  | MemberJoinEventHandlerOptions;

export type HandlerFunction<T extends DiscordEvent> =
  | ButtonClickedHandlerFunction<T>
  | ContextMenuMessageHandlerFunction<T>
  | ContextMenuUserHandlerFunction<T>
  | MemberLeaveHandlerFunction<T>
  | MessageHandlerFunction<T>
  | ReactionHandlerFunction<T>
  | ReadyHandlerFunction<T>
  | GuildMemberUpdateHandlerFunction<T>
  | SlashCommandHandlerFunction<T>
  | ThreadCreatedHandlerFunction<T>
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
    case DiscordEvent.CONTEXT_MENU_MESSAGE:
      return addContextMenuMessageHandler(
        options,
        ioc,
        tree as StringIndexedHIOCTree<DiscordEvent.CONTEXT_MENU_MESSAGE>
      );
    case DiscordEvent.CONTEXT_MENU_USER:
      return addContextMenuUserHandler(
        options,
        ioc,
        tree as StringIndexedHIOCTree<DiscordEvent.CONTEXT_MENU_USER>
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
    case DiscordEvent.SLASH_COMMAND:
      return addSlashCommandHandler(
        options,
        ioc,
        tree as StringIndexedHIOCTree<DiscordEvent.SLASH_COMMAND>
      );
    case DiscordEvent.THREAD_CREATE:
      return addThreadCreateHandler(
        options,
        ioc,
        tree as StringIndexedHIOCTree<DiscordEvent.THREAD_CREATE>
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
      case DiscordEvent.CONTEXT_MENU_MESSAGE:
        return extractContextMenuMessageInfo(
          args[0] as MessageContextMenuCommandInteraction
        );
      case DiscordEvent.CONTEXT_MENU_USER:
        return extractContextMenuUserInfo(
          args[0] as UserContextMenuCommandInteraction
        );
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
      case DiscordEvent.THREAD_CREATE:
        return extractThreadCreateInfo(
          args[0] as ThreadChannel,
          args[1] as boolean
        );
      case DiscordEvent.TIMER:
        return extractTimerInfo(args[0] as Timer);
      case DiscordEvent.SLASH_COMMAND:
        return extractSlashCommandInfo(args[0] as ChatInputCommandInteraction);
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

export const rejectWithError = async (
  error: Error,
  event: DiscordEvent,
  ...args: Parameters<HandlerFunction<DiscordEvent>>
): Promise<unknown> => {
  let detailedMessage: string;

  switch (event) {
    case DiscordEvent.MESSAGE:
      const messageArg = args[0] as Message;
      detailedMessage = ErrorDetailReplacer.replaceErrorDetails(
        error.message,
        messageArg.guild,
        error
      );
      return await Tools.handleUserError(messageArg, detailedMessage);
    case DiscordEvent.SLASH_COMMAND:
    case DiscordEvent.BUTTON_CLICKED:
    case DiscordEvent.CONTEXT_MENU_MESSAGE:
    case DiscordEvent.CONTEXT_MENU_USER:
      const interactionArg = args[0] as RepliableInteraction;

      detailedMessage = ErrorDetailReplacer.replaceErrorDetails(
        error.message,
        interactionArg.guild,
        error
      );

      if (interactionArg.deferred || interactionArg.replied) {
        return await interactionArg.editReply({
          content: detailedMessage,
          components: [],
        });
      }

      return await interactionArg.reply({
        content: detailedMessage,
        ephemeral: true,
      });
    default:
      logger.error(
        `Tried to reject event ${event} with message: ${error.message} but rejection isn't implemented for this event.`
      );
  }
};
