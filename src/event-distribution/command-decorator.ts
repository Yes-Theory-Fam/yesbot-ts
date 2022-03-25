import { EventHandlerOptions, isMessageRelated } from "./events/events";
import { SlashCommandHandlerOptions } from "./events/slash-commands";
import {
  DiscordEvent,
  EventLocation,
  MessageRelatedOptions,
} from "./types/base";
import { HandlerClass } from "./types/handler";
import distribution from "./index";
import { createYesBotLogger } from "../log";

const logger = createYesBotLogger("event-distribution", "Command");
const explanation =
  "Commands that require roles or channel names won't work in DMs since the roles cannot be read from DM events.";

export const Command = <T extends EventHandlerOptions>(options: T) => {
  if (isMessageRelated(options)) {
    setDefaultOnMessageRelatedOptions(options);
  }

  return <U extends HandlerClass<T["event"]>>(target: U) => {
    const commandClassName = target.name;
    logger.debug(`Loading new command: ${target.name}`);

    if (isMessageRelated(options)) {
      checkMessageRelatedOptions(options, commandClassName);
    }

    if (options.event === DiscordEvent.SLASH_COMMAND) {
      const checkResult = checkSlashCommandRelatedOptions(options);
      if (!checkResult) return target;
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

const baseOptionsRequireServer = (options: MessageRelatedOptions) => {
  const channels = options.channelNames ?? [];
  const roles = options.allowedRoles ?? [];
  return channels.length > 0 || roles.length > 0;
};

const setDefaultOnMessageRelatedOptions = (options: MessageRelatedOptions) => {
  options.location ??= baseOptionsRequireServer(options)
    ? EventLocation.SERVER
    : EventLocation.ANYWHERE;

  options.allowedRoles ??= [];
};

const checkMessageRelatedOptions = (
  options: MessageRelatedOptions,
  commandClassName: string
) => {
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

const checkSlashCommandRelatedOptions = (
  options: SlashCommandHandlerOptions,
  commandClassName: string
) => {
  const { root, subCommand, subCommandGroup } = options;

  if (subCommand && !subCommandGroup) {
    // TODO throw error here :)
  }
};
