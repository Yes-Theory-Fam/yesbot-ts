import { EventDistribution } from "./event-distribution";
import { EventHandlerOptions } from "./events";
import { HandlerClass } from "./types/handler";

const distribution = new EventDistribution();

export * from "./types/handler";

export const Command = <T extends EventHandlerOptions>(options: T) => {
  return <U extends HandlerClass<T["event"]>>(target: U) => {
    distribution.addWithOptions(options, target);
    return target;
  };
};

export default distribution;
export { DiscordEvent } from "./types/base";
