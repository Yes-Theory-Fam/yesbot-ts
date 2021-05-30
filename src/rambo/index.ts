import { Rambo } from "./rambo";
import { EventHandlerOptions } from "./events";
import { HandlerClass } from "./common/handler";

const rambo = new Rambo();

export * from "./common/handler";

export const Command = <T extends EventHandlerOptions>(options: T) => {
  return <U extends HandlerClass<T["event"]>>(target: U) => {
    rambo.addWithOptions(options, target);
    return target;
  };
};

export default rambo;
export { DiscordEvent } from "./types/base";
