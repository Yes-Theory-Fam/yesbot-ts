import { ContextMenuMessageHandlerOptions } from "./context-menu-message.js";
import { ContextMenuUserHandlerOptions } from "./context-menu-user.js";
import { DiscordEvent } from "../../types/base.js";
import { ContextMenuCommandBuilder } from "discord.js";
import { ApplicationCommandType } from "discord-api-types/v10";

type ContextMenuOptions =
  | ContextMenuMessageHandlerOptions
  | ContextMenuUserHandlerOptions;

const getType = (options: ContextMenuOptions) => {
  switch (options.event) {
    case DiscordEvent.CONTEXT_MENU_MESSAGE:
      return ApplicationCommandType.Message;
    case DiscordEvent.CONTEXT_MENU_USER:
      return ApplicationCommandType.User;
    default:
      return undefined;
  }
};

export const buildContextMenuCommand = (command: ContextMenuOptions) => {
  const type = getType(command);
  if (!type) return undefined;

  return new ContextMenuCommandBuilder().setName(command.name).setType(type);
};
