import { EventHandlerOptions } from "./events/events";
import { EventLocation } from "./types/base";
import { HandlerClass } from "./types/handler";
import distribution from "./index";
import { createYesBotLogger } from "../log";

const logger = createYesBotLogger("event-distribution", "Command");
const explanation =
  "Commands that require roles or channel names won't work in DMs since the roles cannot be read from DM events.";

export const Command = <T extends EventHandlerOptions>(options: T) => {
  const channels = options.channelNames ?? [];
  const roles = options.requiredRoles ?? [];
  const requiresServer = channels.length > 0 || roles.length > 0;

  if (!options.location) {
    options.location = requiresServer
      ? EventLocation.SERVER
      : EventLocation.ANYWHERE;
  }

  return <U extends HandlerClass<T["event"]>>(target: U) => {
    const commandClassName = target.name;
    logger.debug(`Loading new command: ${target.name}`);

    if (requiresServer && options.location === EventLocation.DIRECT_MESSAGE) {
      logger.error(
        `Failed to load command ${commandClassName}! The command requires roles or channel names but was set to location ${EventLocation.DIRECT_MESSAGE}. ${explanation}`
      );
      return;
    }

    if (requiresServer && options.location === EventLocation.ANYWHERE) {
      logger.warn(
        `Adding command ${commandClassName} with required roles or limited channels which was set to location ${EventLocation.ANYWHERE}. ${explanation}`
      );
    }

    distribution.addWithOptions(options, target);
    return target;
  };
};
