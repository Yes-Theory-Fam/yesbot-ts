/**
 * This class is used as hub for events sent to the bot. Once initialized, it
 * contains an object holding information on what functions to run on certain
 * events. This object is loaded based on decorators.
 */
import {
  DMChannel,
  Message,
  MessageReaction,
  NewsChannel,
  TextChannel,
  User,
} from "discord.js";
import glob from "glob";
import { createYesBotLogger } from "../log";
import path from "path";

export const enum DiscordEvent {
  Message,
  ReactionAdd,
  ReactionRemove,
  // GuildMemberUpdate,
  // MemberJoin,
  // MemberLeave,
  // Ready,
  // VoiceStateUpdate,
}

interface BaseOptions {
  event: DiscordEvent;
  stateful?: boolean;
  description: string;
  requiredRoles?: string[];
  channelNames?: string[];
}

type EventHandlerOptions =
  | MessageEventHandlerOptions
  | ReactionAddEventHandlerOptions
  | ReactionRemoveEventHandlerOptions;

export interface MessageEventHandlerOptions extends BaseOptions {
  event: DiscordEvent.Message;
  trigger: string;
  aliases?: string[];
}

// Reactions
interface ReactionAddEventHandlerOptions extends BaseOptions {
  emoji: string;
  event: DiscordEvent.ReactionAdd;
}

interface ReactionRemoveEventHandlerOptions extends BaseOptions {
  emoji: string;
  event: DiscordEvent.ReactionRemove;
}

type VoidFunctionWithArgs<T> = T extends any[]
  ? (...args: T) => void
  : (arg: T) => void;

type HandlerFunctionFor<
  Event extends DiscordEvent,
  TargetEvent extends DiscordEvent,
  VoidFunctionArgs
> = Event extends TargetEvent ? VoidFunctionWithArgs<VoidFunctionArgs> : never;

type HandlerFunction<T extends DiscordEvent> =
  | HandlerFunctionFor<T, DiscordEvent.Message, Message>
  | HandlerFunctionFor<
      T,
      DiscordEvent.ReactionAdd | DiscordEvent.ReactionRemove,
      [MessageReaction, User]
    >;

export abstract class CommandHandler<T extends DiscordEvent> {
  public abstract handleEvent(
    ...params: Parameters<HandlerFunction<T>>
  ): ReturnType<HandlerFunction<T>>;
}

type HandlerClass<T extends DiscordEvent> = {
  new (...args: any[]): CommandHandler<T>;
  prototype: typeof CommandHandler["prototype"];
};

type InstanceOrConstructor<T> =
  | T
  | {
      new (...args: any[]): T;
      prototype: any;
    };

type FilterEventHandlerOptionsByEvent<
  Options extends EventHandlerOptions,
  Event extends DiscordEvent
> = Options extends any
  ? Options["event"] extends Event
    ? Options
    : never
  : never;

// Handler Instance Or Constructor
type HIOC<T extends DiscordEvent> = {
  ioc: InstanceOrConstructor<CommandHandler<T>>;
  options: FilterEventHandlerOptionsByEvent<EventHandlerOptions, T>;
};

type StringIndexedHIOCTreeNode<T extends DiscordEvent> =
  | HIOC<T>[]
  | StringIndexedHIOCTree<T>;
type StringIndexedHIOCTree<T extends DiscordEvent> = {
  [key: string]: StringIndexedHIOCTreeNode<T>;
};

const isHIOCArray = <T extends DiscordEvent>(
  tree: StringIndexedHIOCTreeNode<T>
): tree is HIOC<T>[] => Array.isArray(tree);

type RamboHandlers = {
  [key in DiscordEvent]: StringIndexedHIOCTree<key>;
};

const logger = createYesBotLogger("events", "handler");

export class Rambo {
  handlers: RamboHandlers = {
    [DiscordEvent.Message]: {},
    [DiscordEvent.ReactionAdd]: {},
    [DiscordEvent.ReactionRemove]: {},
  };

  handleEvent<T extends DiscordEvent>(
    event: T,
    ...args: Parameters<HandlerFunction<T>>
  ) {
    const eventInfo = this.extractInfo(event, ...args);
    // TODO Handle DM only commands
    // TODO Handle Permission / Role checks
    const eventHandlers = this.getHandlers(
      this.handlers[event],
      eventInfo.handlerKeys
    );

    for (const { ioc } of eventHandlers) {
      let instance = ioc;
      if (typeof instance === "function") instance = new instance();

      instance.handleEvent(...args);
    }
  }

  private extractInfo<T extends DiscordEvent>(
    event: T,
    ...args: Parameters<HandlerFunction<T>>
  ): {
    handlerKeys: string[];
    user: User;
  } {
    const getChannelIdentifier = (
      channel: TextChannel | DMChannel | NewsChannel
    ) => (channel.type === "dm" ? channel.id : channel.name);
    if (event === DiscordEvent.Message) {
      const message = args[0] as Message;
      const channel = message.channel;
      const channelIdentifier = getChannelIdentifier(channel);
      return {
        handlerKeys: [channelIdentifier, message.content.split(" ")[0]],
        user: message.author,
      };
    }

    if (
      event === DiscordEvent.ReactionAdd ||
      event === DiscordEvent.ReactionRemove
    ) {
      const reaction = args[0] as MessageReaction;
      const user = args[1] as User;
      const channel = reaction.message.channel;
      const channelIdentifier = getChannelIdentifier(channel);
      return { handlerKeys: [channelIdentifier, reaction.emoji.name], user };
    }

    logger.error("Could not extract keys for event ", event);
  }

  private getHandlers<T extends DiscordEvent>(
    handlerTree: StringIndexedHIOCTreeNode<T>,
    [currentKey, ...restKeys]: string[]
  ): HIOC<T>[] {
    if (!handlerTree) return [];

    if (isHIOCArray(handlerTree)) return handlerTree;

    const handlers: HIOC<T>[] = [];
    handlers.push(...this.getHandlers(handlerTree[""], restKeys));

    if (!currentKey) {
      return handlers;
    }

    handlers.push(...this.getHandlers(handlerTree[currentKey], restKeys));

    return handlers;
  }

  addWithOptions<T extends EventHandlerOptions>(
    options: T,
    HandlerClass: HandlerClass<T["event"]>
  ) {
    const ioc = options.stateful ? new HandlerClass() : HandlerClass;

    switch (options.event) {
      case DiscordEvent.Message:
        this.addMessageHandler(
          options as MessageEventHandlerOptions,
          ioc as InstanceOrConstructor<CommandHandler<DiscordEvent.Message>>
        );
        break;
      case DiscordEvent.ReactionAdd:
      case DiscordEvent.ReactionRemove:
    }
  }

  private addMessageHandler(
    options: MessageEventHandlerOptions,
    ioc: InstanceOrConstructor<CommandHandler<DiscordEvent.Message>>
  ) {
    const channels = options.channelNames ?? [];
    if (channels.length === 0) channels.push("");

    const trigger = options.trigger ?? "";

    const messageHandlers = this.handlers[DiscordEvent.Message];
    for (const channel of channels) {
      messageHandlers[channel] ??= {};
      const channelTree = messageHandlers[
        channel
      ] as StringIndexedHIOCTree<DiscordEvent.Message>;

      channelTree[trigger] ??= [];
      const triggerHiocs = channelTree[trigger] as HIOC<DiscordEvent.Message>[];

      triggerHiocs.push({ ioc, options });
    }
  }

  async initialize(): Promise<void> {
    return new Promise((res, rej) => {
      glob("src/programs/*.ts", async (e, matches) => {
        if (e) {
          logger.error("Error loading commands: ", e);
          return;
        }

        const loaders = matches
          .filter((p) => !p.endsWith(".spec.ts"))
          .map((p) => {
            const split = p.split(".");
            split.unshift();
            const modulePath = path.join(process.cwd(), split.join("."));

            return import(modulePath);
          });

        try {
          await Promise.all(loaders);
        } catch (e) {
          logger.error("Error loading commands: ", e);
          rej(e);
        }
        logger.debug("Loading complete!");
        res();
      });
    });
  }
}

const rambo = new Rambo();

export const Command = <T extends EventHandlerOptions>(options: T) => {
  return <U extends HandlerClass<T["event"]>>(target: U) => {
    rambo.addWithOptions(options, target);
    return target;
  };
};

export default rambo;
