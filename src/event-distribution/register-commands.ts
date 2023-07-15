import { StringIndexedHIOCTree } from "./types/hioc";
import { DiscordEvent } from "./types/base";
import {
  ContextMenuCommandBuilder,
  SlashCommandBuilder,
  SlashCommandSubcommandGroupBuilder,
  Snowflake,
} from "discord.js";
import { createYesBotLogger } from "../log";
import { getAllOptions } from "./helper";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/rest";
import { buildSlashCommand } from "./events/slash-commands";
import { ApplicationCommandType } from "discord-api-types/v10";
import { buildContextMenuCommand } from "./events/context-menu";

interface RegistrationResponseItem {
  id: string;
  name: string;
  type: ApplicationCommandType;
}

interface RegistrationResult {
  slashCommandTree: StringIndexedHIOCTree<DiscordEvent.SLASH_COMMAND>;
  messageTree: StringIndexedHIOCTree<DiscordEvent.CONTEXT_MENU_MESSAGE>;
  userTree: StringIndexedHIOCTree<DiscordEvent.CONTEXT_MENU_USER>;

  nameIdMap?: Record<string, Snowflake>;
}

export const registerApplicationCommands = async (
  slashCommandTree: StringIndexedHIOCTree<DiscordEvent.SLASH_COMMAND>,
  messageTree: StringIndexedHIOCTree<DiscordEvent.CONTEXT_MENU_MESSAGE>,
  userTree: StringIndexedHIOCTree<DiscordEvent.CONTEXT_MENU_USER>
): Promise<RegistrationResult> => {
  const logger = createYesBotLogger("event-distribution", "register-commands");

  const slashCommands = getAllOptions(slashCommandTree);
  const messageCommands = getAllOptions(messageTree);
  const userCommands = getAllOptions(userTree);

  const builderCache: Record<string, SlashCommandBuilder> = {};
  const groupBuilderCache: Record<string, SlashCommandSubcommandGroupBuilder> =
    {};

  slashCommands.forEach((option) =>
    buildSlashCommand(option, builderCache, groupBuilderCache)
  );
  const builtSlashCommands = Object.values(builderCache).map((builder) =>
    builder.toJSON()
  );

  const builtContextCommands = [...messageCommands, ...userCommands]
    .map(buildContextMenuCommand)
    .filter((c): c is ContextMenuCommandBuilder => !!c)
    .map((c) => c.toJSON());

  const jsonCommands = [...builtContextCommands, ...builtSlashCommands];

  logger.info(`Registering ${jsonCommands.length} application commands`);

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
    const newSlashCommandTree: StringIndexedHIOCTree<DiscordEvent.SLASH_COMMAND> =
      {};
    const nameIdMap: Record<string, Snowflake> = {};

    for (const item of result) {
      const targetTree =
        item.type === ApplicationCommandType.User
          ? newUserCommandTree
          : item.type === ApplicationCommandType.ChatInput
          ? newSlashCommandTree
          : newMessageCommandTree;
      const sourceTree =
        item.type === ApplicationCommandType.User
          ? userTree
          : item.type === ApplicationCommandType.ChatInput
          ? slashCommandTree
          : messageTree;

      targetTree[item.id] = sourceTree[item.name];
      nameIdMap[item.name] = item.id;
    }

    logger.info(
      `Finished registering ${jsonCommands.length} application commands`
    );

    return {
      messageTree: newMessageCommandTree,
      userTree: newUserCommandTree,
      slashCommandTree: newSlashCommandTree,
      nameIdMap: nameIdMap,
    };
  } catch (e) {
    logger.error("Failed registering application commands, exception was ", e);

    return { messageTree, userTree, slashCommandTree };
  }
};
