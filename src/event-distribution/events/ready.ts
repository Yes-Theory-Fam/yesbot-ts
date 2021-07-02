import {
  AddEventHandlerFunction,
  DiscordEvent,
  ExtractInfoForEventFunction,
  HandlerFunctionFor,
} from "../types/base";
import { Client } from "discord.js";
import { HIOC } from "../types/hioc";

export interface ReadyEventHandlerOptions {
  event: DiscordEvent.READY;
  stateful?: false;
}

export type ReadyHandlerFunction<T extends DiscordEvent> = HandlerFunctionFor<
  T,
  DiscordEvent.READY,
  Client
>;

export const addReadyHandler: AddEventHandlerFunction<ReadyEventHandlerOptions> =
  (options, ioc, tree) => {
    const baseKey = "";
    tree[baseKey] ??= [];

    const handlers = tree[baseKey] as HIOC<DiscordEvent.READY>[];
    handlers.push({ ioc, options });
  };

export const extractReadyInfo: ExtractInfoForEventFunction<DiscordEvent.READY> =
  () => ({ handlerKeys: [""], isDirectMessage: false });
