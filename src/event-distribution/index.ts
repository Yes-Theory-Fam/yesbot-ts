import { EventDistribution } from "./event-distribution";
import { EventHandlerOptions } from "./events";
import { HandlerClass } from "./types/handler";
import { MessageLocation } from "./types/base";

const distribution = new EventDistribution();

export * from "./types/handler";

export const Command = <T extends EventHandlerOptions>(options: T) => {
  if (!options.location) {
    const channels = options.channelNames ?? [];
    options.location =
      channels.length > 0 ? MessageLocation.SERVER : MessageLocation.ANYWHERE;
  }

  return <U extends HandlerClass<T["event"]>>(target: U) => {
    distribution.addWithOptions(options, target);
    return target;
  };
};

export default distribution;
export { DiscordEvent } from "./types/base";
