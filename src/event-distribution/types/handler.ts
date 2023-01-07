import { HandlerFunction } from "../events/events";
import { DiscordEvent } from "./base";

export type HandlerClass<T extends DiscordEvent> = {
  new (...args: any[]): CommandHandler<T>;
  prototype: (typeof CommandHandler)["prototype"];
  name: string;
  constructor: {
    name: string;
  };
};

export type PromiseOr<T> = T | Promise<T>;

export abstract class CommandHandler<T extends DiscordEvent> {
  public abstract handle(
    ...params: Parameters<HandlerFunction<T>>
  ): PromiseOr<ReturnType<HandlerFunction<T>>>;
}
