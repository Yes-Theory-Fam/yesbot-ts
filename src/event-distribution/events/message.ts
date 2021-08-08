import {
  AddEventHandlerFunction,
  BaseOptions,
  DiscordEvent,
  ExtractInfoForEventFunction,
  HandlerFunctionFor,
} from "../types/base";
import { DMChannel, Message, NewsChannel, TextChannel } from "discord.js";
import { addToTree } from "../helper";

export interface MessageEventHandlerOptions extends BaseOptions {
  event: DiscordEvent.MESSAGE;
  trigger?: string;
  subTrigger?: string;
}

export type MessageHandlerFunction<T extends DiscordEvent> = HandlerFunctionFor<
  T,
  DiscordEvent.MESSAGE,
  Message
>;

export const addMessageHandler: AddEventHandlerFunction<MessageEventHandlerOptions> =
  (options, ioc, tree) => {
    const channels = options.channelNames ?? [];
    if (channels.length === 0) channels.push("");

    const trigger = options.trigger ?? "";
    const subTrigger = options.subTrigger ?? "";

    for (const channel of channels) {
      addToTree([channel, trigger, subTrigger], { options, ioc }, tree);
    }
  };

export const extractMessageInfo: ExtractInfoForEventFunction<DiscordEvent.MESSAGE> =
  (message) => {
    const getChannelIdentifier = (
      channel: TextChannel | DMChannel | NewsChannel
    ) => (channel.type === "dm" ? channel.id : channel.name);

    const channel = message.channel;
    const channelIdentifier = getChannelIdentifier(channel);

    const split = message.content.split(" ");
    const trigger = split[0];
    const subTrigger = split[1];

    return {
      handlerKeys: [channelIdentifier, trigger, subTrigger],
      member: message.member,
      isDirectMessage: message.channel.type === "dm",
    };
  };
