import { addEventHandler, extractEventInfo, HandlerFunction } from "./events";
import glob from "glob";
import path from "path";
import { createYesBotLogger } from "../log";
import {
  HIOC,
  isHIOCArray,
  StringIndexedHIOCTree,
  StringIndexedHIOCTreeNode,
} from "./types/hioc";
import { EventHandlerOptions } from "./events";
import { HandlerClass } from "./types/handler";
import { DiscordEvent, MessageLocation } from "./types/base";

const logger = createYesBotLogger("event-distribution", "event-distribution");

type EventDistributionHandlers = {
  [key in DiscordEvent]: StringIndexedHIOCTree<key>;
};

export class EventDistribution {
  handlers: EventDistributionHandlers = {
    [DiscordEvent.MESSAGE]: {},
    [DiscordEvent.REACTION_ADD]: {},
    [DiscordEvent.REACTION_REMOVE]: {},
  };

  handleEvent<T extends DiscordEvent>(
    event: T,
    ...args: Parameters<HandlerFunction<T>>
  ) {
    const { handlerKeys, isDirectMessage } = extractEventInfo(event, ...args);
    // TODO Handle Permission / Role checks

    const eventHandlers = this.getHandlers(this.handlers[event], handlerKeys);
    const locationFilteredHandlers = eventHandlers.filter((eh) => {
      const { location } = eh.options;
      switch (location) {
        case MessageLocation.ANYWHERE:
          return true;
        case MessageLocation.DIRECT_MESSAGE:
          return isDirectMessage;
        case MessageLocation.SERVER:
          return !isDirectMessage;
      }
    });

    for (const { ioc } of locationFilteredHandlers) {
      let instance = ioc;
      if (typeof instance === "function") instance = new instance();

      instance.handle(...args);
    }
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
    const tree = this.handlers[options.event];
    addEventHandler(options, ioc, tree);
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
