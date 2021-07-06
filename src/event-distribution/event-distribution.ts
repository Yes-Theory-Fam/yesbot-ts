import {
  addEventHandler,
  EventHandlerOptions,
  extractEventInfo,
  HandlerFunction,
} from "./events/events";
import glob from "glob";
import path from "path";
import { createYesBotLogger } from "../log";
import {
  HIOC,
  isHIOCArray,
  StringIndexedHIOCTree,
  StringIndexedHIOCTreeNode,
} from "./types/hioc";
import { HandlerClass } from "./types/handler";
import { DiscordEvent, EventLocation } from "./types/base";

const logger = createYesBotLogger("event-distribution", "event-distribution");

type EventDistributionHandlers = {
  [key in DiscordEvent]: StringIndexedHIOCTree<key>;
};

export class EventDistribution {
  handlers: EventDistributionHandlers = {
    [DiscordEvent.MEMBER_LEAVE]: {},
    [DiscordEvent.MESSAGE]: {},
    [DiscordEvent.REACTION_ADD]: {},
    [DiscordEvent.REACTION_REMOVE]: {},
    [DiscordEvent.GUILD_MEMBER_UPDATE]: {},
    [DiscordEvent.READY]: {},
    [DiscordEvent.VOICE_STATE_UPDATE]: {},
  };

  handleEvent<T extends DiscordEvent>(
    event: T,
    ...args: Parameters<HandlerFunction<T>>
  ) {
    const infos = extractEventInfo(event, ...args);

    for (const info of infos) {
      const { handlerKeys, isDirectMessage, member } = info;

      const roleNames = member?.roles.cache.map((r) => r.name) ?? [];
      const eventHandlers = this.getHandlers(this.handlers[event], handlerKeys);
      const filteredHandlers = this.filterHandlers(
        eventHandlers,
        isDirectMessage,
        roleNames
      );

      for (const { ioc } of filteredHandlers) {
        let instance = ioc;
        if (typeof instance === "function") instance = new instance();

        instance.handle(...args);
      }
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
      const extension = process.env.NODE_ENV === "production" ? ".js" : ".ts";
      const directory = process.env.NODE_ENV === "production" ? "build" : "src";

      glob(`${directory}/programs/*${extension}`, async (e, matches) => {
        if (e) {
          logger.error("Error loading commands: ", e);
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
        }
        logger.debug("Loading complete!");
        res();
      });
    });
  }

  private filterHandlers<T extends DiscordEvent>(
    handlers: HIOC<T>[],
    isDirectMessage: boolean,
    roleNames: string[]
  ): HIOC<T>[] {
    const locationFilteredHandlers = handlers.filter((eh) => {
      if (
        eh.options.event === DiscordEvent.GUILD_MEMBER_UPDATE ||
        eh.options.event === DiscordEvent.MEMBER_LEAVE ||
        eh.options.event === DiscordEvent.VOICE_STATE_UPDATE ||
        eh.options.event === DiscordEvent.READY
      )
        return true;

      const { location } = eh.options;
      switch (location) {
        case EventLocation.ANYWHERE:
          return true;
        case EventLocation.DIRECT_MESSAGE:
          return isDirectMessage;
        case EventLocation.SERVER:
          return !isDirectMessage;
      }
    });

    return locationFilteredHandlers.filter((eh) => {
      if (
        eh.options.event === DiscordEvent.GUILD_MEMBER_UPDATE ||
        eh.options.event === DiscordEvent.MEMBER_LEAVE ||
        eh.options.event === DiscordEvent.VOICE_STATE_UPDATE ||
        eh.options.event === DiscordEvent.READY
      )
        return true;

      const { requiredRoles } = eh.options;
      return requiredRoles.every((role) => roleNames.includes(role));
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
