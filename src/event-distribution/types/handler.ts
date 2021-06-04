import { HandlerFunction } from "../events";
import { DiscordEvent } from "./base";

export type HandlerClass<T extends DiscordEvent> = {
  new (...args: any[]): CommandHandler<T>;
  prototype: typeof CommandHandler["prototype"];
};

export abstract class CommandHandler<T extends DiscordEvent> {
  public abstract handle(
    ...params: Parameters<HandlerFunction<T>>
  ): ReturnType<HandlerFunction<T>>;
}
