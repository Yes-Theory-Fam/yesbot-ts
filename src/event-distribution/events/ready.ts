import {
  AddEventHandlerFunction,
  DiscordEvent,
  ExtractInfoForEventFunction,
  HandlerFunctionFor,
} from "../types/base";
import { Client } from "discord.js";
import { addToTree } from "../helper";

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
  (options, ioc, tree) => addToTree([""], { options, ioc }, tree);

export const extractReadyInfo: ExtractInfoForEventFunction<DiscordEvent.READY> =
  () => ({ handlerKeys: [""], isDirectMessage: false });
