import {
  AddEventHandlerFunction,
  DiscordEvent,
  ExtractInfoForEventFunction,
  HandlerFunctionFor,
} from "../../types/base.js";
import { addToTree, ensureGuildMemberOrNull } from "../../helper.js";
import { UserContextMenuCommandInteraction } from "discord.js";
import { ContextMenuOptions } from "./common.js";

export interface ContextMenuUserHandlerOptions extends ContextMenuOptions {
  event: DiscordEvent.CONTEXT_MENU_USER;
  name: string;
}

export type ContextMenuUserHandlerFunction<T extends DiscordEvent> =
  HandlerFunctionFor<
    T,
    DiscordEvent.CONTEXT_MENU_USER,
    UserContextMenuCommandInteraction
  >;

export const addContextMenuUserHandler: AddEventHandlerFunction<
  ContextMenuUserHandlerOptions
> = (options, ioc, tree) => {
  const keys = [options.name];

  addToTree(keys, { options, ioc }, tree);
};

export const extractContextMenuUserInfo: ExtractInfoForEventFunction<
  DiscordEvent.CONTEXT_MENU_USER
> = (command: UserContextMenuCommandInteraction) => {
  const member = ensureGuildMemberOrNull(
    command.member,
    command.client,
    command.guild
  );

  return {
    member: member,
    content: null,
    isDirectMessage: false,
    handlerKeys: [command.commandId],
  };
};
