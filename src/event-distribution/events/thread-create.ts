import { ThreadChannel } from "discord.js";
import { addToTree } from "../helper";
import {
  AddEventHandlerFunction,
  BaseOptions,
  DiscordEvent,
  ExtractInfoForEventFunction,
  HandlerFunctionFor,
} from "../types/base";

export interface ThreadCreateHandlerOptions extends BaseOptions {
  event: DiscordEvent.THREAD_CREATE;
  parentName?: string;
  newlyCreated?: boolean;
}

export type ThreadCreatedHandlerFunction<T extends DiscordEvent> =
  HandlerFunctionFor<T, DiscordEvent.THREAD_CREATE, [ThreadChannel, boolean]>;

export const addThreadCreateHandler: AddEventHandlerFunction<
  ThreadCreateHandlerOptions
> = (options, ioc, tree) => {
  addToTree(
    [options.parentName ?? "", options.newlyCreated?.toString() ?? ""],
    { options, ioc },
    tree
  );
};

export const extractThreadCreateInfo: ExtractInfoForEventFunction<
  DiscordEvent.THREAD_CREATE
> = (channel, newlyCreated) => {
  const parentName = channel.parent?.name ?? "";
  const createdKey = newlyCreated?.toString() ?? "";

  const threadOwner = channel.ownerId;
  const member = threadOwner
    ? channel.guild.members.resolve(threadOwner)
    : null;

  return {
    handlerKeys: [parentName, createdKey],
    isDirectMessage: false, // threads are only a server thing
    member,
  };
};
