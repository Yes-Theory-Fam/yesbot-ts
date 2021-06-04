import {
  AddEventHandlerFunction,
  BaseOptions,
  DiscordEvent,
  ExtractInfoForEventFunction,
  ExtractInfoFunction,
  HandlerFunctionFor,
} from "../types/base";
import Discord, {
  DMChannel,
  Message,
  NewsChannel,
  TextChannel,
} from "discord.js";
import {
  HIOC,
  InstanceOrConstructor,
  StringIndexedHIOCTree,
} from "../types/hioc";
import { CommandHandler } from "../types/handler";

export interface MessageEventHandlerOptions extends BaseOptions {
  event: DiscordEvent.MESSAGE;
  trigger: string;
  aliases?: string[];
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

    for (const channel of channels) {
      tree[channel] ??= {};
      const channelTree = tree[
        channel
      ] as StringIndexedHIOCTree<DiscordEvent.MESSAGE>;

      channelTree[trigger] ??= [];
      const triggerHiocs = channelTree[trigger] as HIOC<DiscordEvent.MESSAGE>[];

      triggerHiocs.push({ ioc, options });
    }
  };

export const extractMessageInfo: ExtractInfoForEventFunction<DiscordEvent.MESSAGE> =
  (message) => {
    const getChannelIdentifier = (
      channel: TextChannel | DMChannel | NewsChannel
    ) => (channel.type === "dm" ? channel.id : channel.name);

    const channel = message.channel;
    const channelIdentifier = getChannelIdentifier(channel);
    return {
      handlerKeys: [channelIdentifier, message.content.split(" ")[0]],
      user: message.author,
      isDm: message.channel.type === "dm",
    };
  };
