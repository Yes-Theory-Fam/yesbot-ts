import {
  AddEventHandlerFunction,
  DiscordEvent,
  ExtractInfoForEventFunction,
  HandlerFunctionFor,
  MessageRelatedOptions,
} from "../types/base";
import { GuildChannel, Message, TextBasedChannel } from "discord.js";
import {
  addToTree,
  collectChannelDefinitions,
  getIdFromCategoryName,
  withMessageRelatedInfo,
} from "../helper";

export interface MessageEventHandlerOptions extends MessageRelatedOptions {
  event: DiscordEvent.MESSAGE;
  description: string;
  trigger?: string;
  subTrigger?: string;
}

export type MessageHandlerFunction<T extends DiscordEvent> = HandlerFunctionFor<
  T,
  DiscordEvent.MESSAGE,
  Message
>;

export const addMessageHandler: AddEventHandlerFunction<
  MessageEventHandlerOptions
> = (options, ioc, tree) => {
  const trigger = options.trigger?.toLowerCase() ?? "";
  const subTrigger = options.subTrigger?.toLowerCase() ?? "";
  const combinedChannels = collectChannelDefinitions(options);

  for (const channel of combinedChannels) {
    addToTree([channel, trigger, subTrigger], { options, ioc }, tree);
  }
};

export const extractMessageInfo: ExtractInfoForEventFunction<
  DiscordEvent.MESSAGE
> = (message) => {
  const split = message.content.toLowerCase().split(" ");
  const trigger = split[0] ?? "";
  const subTrigger = split[1] ?? "";

  return withMessageRelatedInfo(message, message.member, (channelId) => [
    channelId,
    trigger,
    subTrigger,
  ]);
};
