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
  UserContextMenuCommandInteraction,
} from "discord.js";
import { ApplicationCommandType } from "discord-api-types/v10";
import { ContextMenuOptions } from "./common";

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

const yeet = () => {
  new ContextMenuCommandBuilder()
    .setType(ApplicationCommandType.Message)
    .setName("");
};
