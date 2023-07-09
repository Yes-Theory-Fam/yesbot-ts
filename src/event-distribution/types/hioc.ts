import { CommandHandler } from "./handler";
import { EventHandlerOptions } from "../events/events";
import { DiscordEvent } from "./base";

export type InstanceOrConstructor<T> =
  | T
  | {
      new (...args: any[]): T;
      prototype: any;
    };

// Handler Instance Or Constructor
export type HIOC<T extends DiscordEvent> = {
  ioc: InstanceOrConstructor<CommandHandler<T>>;
  options: Extract<EventHandlerOptions, { event: T }>;
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
