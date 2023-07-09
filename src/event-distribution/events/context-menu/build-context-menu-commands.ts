import { ContextMenuUserHandlerOptions } from "./context-menu-user";
import { ContextMenuMessageHandlerOptions } from "./context-menu-message";
import { ContextMenuCommandBuilder, Snowflake } from "discord.js";
import { DiscordEvent } from "../../types/base";
import { ApplicationCommandType } from "discord-api-types/v10";
import { Routes } from "discord-api-types/rest";
import { StringIndexedHIOCTree } from "../../types/hioc";
import { createYesBotLogger } from "../../../log";
import { getAllOptions } from "../../helper";
import { REST } from "@discordjs/rest";

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

const buildContextMenuCommand = (command: ContextMenuOptions) => {
  const type = getType(command);
  if (!type) return undefined;

  return new ContextMenuCommandBuilder().setName(command.name).setType(type);
};

interface RegistrationResponseItem {
  id: string;
  name: string;
  type: ApplicationCommandType;
}

interface RegistrationResult {
  messageTree: StringIndexedHIOCTree<DiscordEvent.CONTEXT_MENU_MESSAGE>;
  userTree: StringIndexedHIOCTree<DiscordEvent.CONTEXT_MENU_USER>;

  nameIdMap?: Record<string, Snowflake>;
}

export const registerContextMenuCommands = async (
  messageTree: StringIndexedHIOCTree<DiscordEvent.CONTEXT_MENU_MESSAGE>,
  userTree: StringIndexedHIOCTree<DiscordEvent.CONTEXT_MENU_USER>
): Promise<RegistrationResult> => {
  const logger = createYesBotLogger(
    "event-distribution",
    "register-context-menu-commands"
  );

  const messageCommands = getAllOptions(messageTree);
  const userCommands = getAllOptions(userTree);

  const builtCommands = [...messageCommands, ...userCommands].map(
    buildContextMenuCommand
  );

  const jsonCommands = builtCommands
    .filter((c): c is ContextMenuCommandBuilder => !!c)
    .map((c) => c.toJSON());

  logger.info(`Registering ${jsonCommands.length} context menu commands`);

  const rest = new REST({ version: "10" }).setToken(process.env.BOT_TOKEN);
  try {
    const result = (await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: jsonCommands }
    )) as RegistrationResponseItem[];

    const newMessageCommandTree: StringIndexedHIOCTree<DiscordEvent.CONTEXT_MENU_MESSAGE> =
      {};
    const newUserCommandTree: StringIndexedHIOCTree<DiscordEvent.CONTEXT_MENU_USER> =
      {};
    const nameIdMap: Record<string, Snowflake> = {};

    for (const item of result) {
      const targetTree =
        item.type === ApplicationCommandType.User
          ? newUserCommandTree
          : newMessageCommandTree;
      const sourceTree =
        item.type === ApplicationCommandType.User ? userTree : messageTree;

      targetTree[item.id] = sourceTree[item.name];
      nameIdMap[item.name] = item.id;
    }

    logger.info(
      `Finished registering ${jsonCommands.length} context menu commands`
    );

    return {
      messageTree: newMessageCommandTree,
      userTree: newUserCommandTree,
      nameIdMap: nameIdMap,
    };
  } catch (e) {
    logger.error("Failed registering context menu commands, exception was ", e);

    return { messageTree, userTree };
  }
};
