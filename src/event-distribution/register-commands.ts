import { StringIndexedHIOCTree } from "./types/hioc.js";
import { DiscordEvent } from "./types/base.js";
import {
  ContextMenuCommandBuilder,
  SlashCommandBuilder,
  SlashCommandSubcommandGroupBuilder,
  Snowflake,
} from "discord.js";
import { createYesBotLogger } from "../log.js";
import { getAllOptions } from "./helper.js";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/rest";
import { buildSlashCommand } from "./events/slash-commands/index.js";
import { ApplicationCommandType } from "discord-api-types/v10";
import { buildContextMenuCommand } from "./events/context-menu/index.js";

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
  const logger = createYesBotLogger(
    "event-distribution/index.js",
    "register-commands"
  );

  const slashCommands = getAllOptions(slashCommandTree);
  const messageCommands = getAllOptions(messageTree);
  const userCommands = getAllOptions(userTree);

  const builderCache: Record<string, SlashCommandBuilder> = {};
  const globalBuilderCache: Record<string, SlashCommandBuilder> = {};
  const groupBuilderCache: Record<string, SlashCommandSubcommandGroupBuilder> =
    {};

  slashCommands.forEach((option) =>
    buildSlashCommand(
      option,
      option.global ? globalBuilderCache : builderCache,
      groupBuilderCache
    )
  );

  const builtSlashCommands = Object.values(builderCache).map((builder) =>
    builder.toJSON()
  );
  const builtGlobalSlashCommands = Object.values(globalBuilderCache).map((b) =>
    b.toJSON()
  );

  const builtContextCommands = [...messageCommands, ...userCommands]
    .map(buildContextMenuCommand)
    .filter((c): c is ContextMenuCommandBuilder => !!c)
    .map((c) => c.toJSON());

  const jsonCommands = [...builtContextCommands, ...builtSlashCommands];

  const commandCountString = `${jsonCommands.length} guild application commands and ${builtGlobalSlashCommands.length} global commands.`;

  logger.info(`Registering ${commandCountString}`);

  const rest = new REST({ version: "10" }).setToken(process.env.BOT_TOKEN);
  try {
    const result = (await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: jsonCommands }
    )) as RegistrationResponseItem[];

    const globalResult = (await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: builtGlobalSlashCommands }
    )) as RegistrationResponseItem[];

    const results = [...result, ...globalResult];

    const newMessageCommandTree: StringIndexedHIOCTree<DiscordEvent.CONTEXT_MENU_MESSAGE> =
      {};
    const newUserCommandTree: StringIndexedHIOCTree<DiscordEvent.CONTEXT_MENU_USER> =
      {};
    const newSlashCommandTree: StringIndexedHIOCTree<DiscordEvent.SLASH_COMMAND> =
      {};
    const nameIdMap: Record<string, Snowflake> = {};

    for (const item of results) {
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

    logger.info(`Finished registering ${commandCountString}`);

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
