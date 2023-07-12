import {
  AddEventHandlerFunction,
  BaseOptions,
  DiscordEvent,
  ExtractInfoForEventFunction,
  HandlerFunctionFor,
} from "../../types/base";
import { addToTree, ensureGuildMemberOrNull } from "../../helper";
import {
  ContextMenuCommandBuilder,
  MessageContextMenuCommandInteraction,
} from "discord.js";
import { ApplicationCommandType } from "discord-api-types/v10";
import { ContextMenuOptions } from "./common";

export interface ContextMenuMessageHandlerOptions extends ContextMenuOptions {
  event: DiscordEvent.CONTEXT_MENU_MESSAGE;
  name: string;
}

export type ContextMenuMessageHandlerFunction<T extends DiscordEvent> =
  HandlerFunctionFor<
    T,
    DiscordEvent.CONTEXT_MENU_MESSAGE,
    MessageContextMenuCommandInteraction
  >;

export const addContextMenuMessageHandler: AddEventHandlerFunction<
  ContextMenuMessageHandlerOptions
> = (options, ioc, tree) => {
  const keys = [options.name];

  addToTree(keys, { options, ioc }, tree);
};

export const extractContextMenuMessageInfo: ExtractInfoForEventFunction<
  DiscordEvent.CONTEXT_MENU_MESSAGE
> = (command: MessageContextMenuCommandInteraction) => {
  const member = ensureGuildMemberOrNull(
    command.member,
    command.client,
    command.guild
  );

  return {
    member,
    content: null,
    isDirectMessage: false,
    handlerKeys: [command.commandId],
  };
};
