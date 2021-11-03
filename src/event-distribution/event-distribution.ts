import {
  addEventHandler,
  EventHandlerOptions,
  extractEventInfo,
  HandlerFunction,
  isMessageRelated,
  rejectWithMessage,
} from "./events/events";
import glob from "glob";
import path from "path";
import { createYesBotLogger } from "../log";
import {
  HIOC,
  InstanceOrConstructor,
  isHIOCArray,
  StringIndexedHIOCTree,
  StringIndexedHIOCTreeNode,
} from "./types/hioc";
import { CommandHandler, HandlerClass } from "./types/handler";
import {
  DiscordEvent,
  EventLocation,
  HandlerInfo,
  HandlerRejectedReason,
} from "./types/base";
import { getIocName } from "./helper";
import { Interaction } from "discord.js";

const logger = createYesBotLogger("event-distribution", "event-distribution");

type EventDistributionHandlers = {
  [key in DiscordEvent]: StringIndexedHIOCTree<key>;
};

type FilterRejection<T extends DiscordEvent> = {
  handler: HIOC<T>;
  accepted: false;
  reason: HandlerRejectedReason;
};

type FilterResult<T extends DiscordEvent> =
  | { handler: HIOC<T>; accepted: true }
  | FilterRejection<T>;

const isRejection = <T extends DiscordEvent>(
  result: FilterResult<T>
): result is FilterRejection<T> => !result.accepted;

export class EventDistribution {
  handlers: EventDistributionHandlers = {
    [DiscordEvent.BUTTON_CLICKED]: {},
    [DiscordEvent.MEMBER_LEAVE]: {},
    [DiscordEvent.MESSAGE]: {},
    [DiscordEvent.REACTION_ADD]: {},
    [DiscordEvent.REACTION_REMOVE]: {},
    [DiscordEvent.GUILD_MEMBER_UPDATE]: {},
    [DiscordEvent.READY]: {},
    [DiscordEvent.TIMER]: {},
    [DiscordEvent.VOICE_STATE_UPDATE]: {},
    [DiscordEvent.MEMBER_JOIN]: {},
  };

  private infoToFilterResults<T extends DiscordEvent>(
    info: HandlerInfo,
    event: T
  ): FilterResult<T>[] {
    const { handlerKeys, isDirectMessage, member } = info;

    const roleNames = member?.roles.cache.map((r) => r.name) ?? [];
    const eventHandlers = this.getHandlers<T>(
      this.handlers[event] as StringIndexedHIOCTreeNode<T>,
      handlerKeys
    );
    return this.filterHandlers<T>(eventHandlers, isDirectMessage, roleNames);
  }

  async handleInteraction(interaction: Interaction) {
    if (interaction.isButton()) {
      return await this.handleEvent(DiscordEvent.BUTTON_CLICKED, interaction);
    }
  }

  async handleEvent<T extends DiscordEvent>(
    event: T,
    ...args: Parameters<HandlerFunction<T>>
  ) {
    const infos = extractEventInfo(event, ...args);
    const filterResults = infos.flatMap((i) =>
      this.infoToFilterResults(i, event)
    );

    const acceptedHiocs = filterResults
      .filter(({ accepted }) => accepted)
      .map(({ handler }: FilterResult<T>) => handler);

    const completedIocs: InstanceOrConstructor<CommandHandler<T>>[] = [];

    for (const {
      ioc,
      options: { errors },
    } of acceptedHiocs) {
      if (completedIocs.includes(ioc)) continue;

      let instance = ioc;
      if (typeof instance === "function") instance = new instance();

      try {
        await instance.handle(...args);
      } catch (e) {
        logger.error(`Error running handler ${getIocName(ioc)}: `, e);
        const reason = e instanceof Error ? e.message : e.toString();
        if (errors && errors[reason]) {
          const text = errors[reason];
          await rejectWithMessage(text, event, ...args);
        }
      }

      completedIocs.push(ioc);
    }

    const rejections = filterResults.filter(isRejection);
    for (const { handler, reason } of rejections) {
      const {
        options: { errors },
        ioc,
      } = handler;
      if (completedIocs.includes(ioc)) continue;
      if (!errors || !errors[reason]) continue;

      const text = errors[reason];
      await rejectWithMessage(text, event, ...args);

      completedIocs.push(ioc);
    }
  }

  addWithOptions<T extends EventHandlerOptions>(
    options: T,
    HandlerClass: HandlerClass<T["event"]>
  ) {
    const ioc = options.stateful ? new HandlerClass() : HandlerClass;
    const tree = this.handlers[options.event];
    addEventHandler(options, ioc, tree);
  }

  async initialize(): Promise<void> {
    return new Promise((res, rej) => {
      const isProduction = process.env.NODE_ENV === "production";
      const extension = isProduction ? ".js" : ".ts";
      const directory = isProduction ? "build" : "src";

      glob(`${directory}/programs/**/*${extension}`, async (e, matches) => {
        if (e) {
          logger.error("Error loading commands: ", e);
          rej(e);
          return;
        }

        const loaders = matches
          .filter((p) => !p.endsWith(`.spec${extension}`))
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
          return;
        }
        logger.debug("Loading complete!");
        res();
      });
    });
  }

  private static isHandlerForLocation<T extends DiscordEvent>(
    handler: HIOC<T>,
    isDirectMessage: boolean
  ): boolean {
    if (!isMessageRelated(handler.options)) return true;

    const { location } = handler.options;
    switch (location) {
      case EventLocation.ANYWHERE:
        return true;
      case EventLocation.DIRECT_MESSAGE:
        return isDirectMessage;
      case EventLocation.SERVER:
        return !isDirectMessage;
    }
  }

  private static isHandlerForRole<T extends DiscordEvent>(
    handler: HIOC<T>,
    roleNames: string[]
  ): boolean {
    if (!isMessageRelated(handler.options)) return true;

    const { allowedRoles } = handler.options;
    return (
      allowedRoles.length === 0 ||
      allowedRoles.some((role) => roleNames.includes(role))
    );
  }

  private filterHandlers<T extends DiscordEvent>(
    handlers: HIOC<T>[],
    isDirectMessage: boolean,
    roleNames: string[]
  ): FilterResult<T>[] {
    return handlers
      .map<FilterResult<T>>((eh) => {
        const isForLocation = EventDistribution.isHandlerForLocation(
          eh,
          isDirectMessage
        );
        return isForLocation
          ? { handler: eh, accepted: true }
          : {
              handler: eh,
              accepted: false,
              reason: HandlerRejectedReason.WRONG_LOCATION,
            };
      })
      .map<FilterResult<T>>((r) => {
        if (!r.accepted) return r;

        const isForRole = EventDistribution.isHandlerForRole(
          r.handler,
          roleNames
        );
        return isForRole
          ? r
          : {
              ...r,
              accepted: false,
              reason: HandlerRejectedReason.MISSING_ROLE,
            };
      });
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
}
