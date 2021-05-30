import { CommandHandler } from "../common/handler";
import { EventHandlerOptions } from "../events";
import { DiscordEvent } from "./base";

export type InstanceOrConstructor<T> =
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
export type HIOC<T extends DiscordEvent> = {
  ioc: InstanceOrConstructor<CommandHandler<T>>;
  options: FilterEventHandlerOptionsByEvent<EventHandlerOptions, T>;
};

export type StringIndexedHIOCTreeNode<T extends DiscordEvent> =
  | HIOC<T>[]
  | StringIndexedHIOCTree<T>;

export type StringIndexedHIOCTree<T extends DiscordEvent> = {
  [key: string]: StringIndexedHIOCTreeNode<T>;
};

export const isHIOCArray = <T extends DiscordEvent>(
  tree: StringIndexedHIOCTreeNode<T>
): tree is HIOC<T>[] => Array.isArray(tree);
