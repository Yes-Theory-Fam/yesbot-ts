import { HandlerFunction } from "../events";
import { DiscordEvent } from "../types/base";

export type HandlerClass<T extends DiscordEvent> = {
  new (...args: any[]): CommandHandler<T>;
  prototype: typeof CommandHandler["prototype"];
};

export abstract class CommandHandler<T extends DiscordEvent> {
  public abstract handleEvent(
    ...params: Parameters<HandlerFunction<T>>
  ): ReturnType<HandlerFunction<T>>;
}
