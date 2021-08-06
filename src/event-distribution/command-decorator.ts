import { EventHandlerOptions } from "./events/events";
import { BaseOptions, DiscordEvent, EventLocation } from "./types/base";
import { HandlerClass } from "./types/handler";
import distribution from "./index";
import { createYesBotLogger } from "../log";

const logger = createYesBotLogger("event-distribution", "Command");
const explanation =
  "Commands that require roles or channel names won't work in DMs since the roles cannot be read from DM events.";

export const Command = <T extends EventHandlerOptions>(options: T) => {
  if (
    options.event !== DiscordEvent.GUILD_MEMBER_UPDATE &&
    options.event !== DiscordEvent.MEMBER_LEAVE &&
    options.event !== DiscordEvent.VOICE_STATE_UPDATE &&
    options.event !== DiscordEvent.TIMER &&
    options.event !== DiscordEvent.READY
  ) {
    setDefaultOnBaseOptions(options);
  }

  return <U extends HandlerClass<T["event"]>>(target: U) => {
    const commandClassName = target.name;
    logger.debug(`Loading new command: ${target.name}`);

    if (
      options.event !== DiscordEvent.GUILD_MEMBER_UPDATE &&
      options.event !== DiscordEvent.MEMBER_LEAVE &&
      options.event !== DiscordEvent.VOICE_STATE_UPDATE &&
      options.event !== DiscordEvent.TIMER &&
      options.event !== DiscordEvent.READY
    ) {
      checkBaseOptions(options, commandClassName);
    }

    try {
      distribution.addWithOptions(options, target);
    } catch (e) {
      logger.error(
        `Failed to load command ${commandClassName}! Error was: `,
        e instanceof Error ? { error: e.message } : e
      );
    }
    return target;
  };
};

const baseOptionsRequireServer = (options: BaseOptions) => {
  const channels = options.channelNames ?? [];
  const roles = options.requiredRoles ?? [];
  return channels.length > 0 || roles.length > 0;
};

const setDefaultOnBaseOptions = (options: BaseOptions) => {
  options.location ??= baseOptionsRequireServer(options)
    ? EventLocation.SERVER
    : EventLocation.ANYWHERE;

  options.requiredRoles ??= [];
};

const checkBaseOptions = (options: BaseOptions, commandClassName: string) => {
  const requiresServer = baseOptionsRequireServer(options);
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
};
