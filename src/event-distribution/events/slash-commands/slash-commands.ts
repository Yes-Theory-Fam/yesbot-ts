import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/rest";
import {
  ChannelType,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
  SlashCommandSubcommandGroupBuilder,
  Snowflake,
} from "discord.js";
import { createYesBotLogger } from "../../../log";
import {
  addToTree,
  ensureGuildMemberOrNull,
  getAllOptions,
} from "../../helper";
import {
  AddEventHandlerFunction,
  BaseOptions,
  DiscordEvent,
  ExtractInfoForEventFunction,
  HandlerFunctionFor,
} from "../../types/base";
import { StringIndexedHIOCTree } from "../../types/hioc";
import {
  addOptions,
  APIApplicationCommandBasicOptionWithAutoCompleteHandler,
} from "./add-options";

export interface SlashCommandHandlerOptions extends BaseOptions {
  event: DiscordEvent.SLASH_COMMAND;

  root: string;
  subCommand?: string;
  subCommandGroup?: string;

  description: string;
  options?: APIApplicationCommandBasicOptionWithAutoCompleteHandler[];
}

export type SlashCommandHandlerFunction<T extends DiscordEvent> =
  HandlerFunctionFor<
    T,
    DiscordEvent.SLASH_COMMAND,
    ChatInputCommandInteraction
  >;

export const addSlashCommandHandler: AddEventHandlerFunction<
  SlashCommandHandlerOptions
> = (options, ioc, tree) => {
  const keys = [
    options.root,
    options.subCommandGroup ?? "",
    options.subCommand ?? "",
  ];

  addToTree(keys, { options, ioc }, tree);
};

export const extractSlashCommandInfo: ExtractInfoForEventFunction<
  DiscordEvent.SLASH_COMMAND
> = (command: ChatInputCommandInteraction) => {
  const member = ensureGuildMemberOrNull(
    command.member,
    command.client,
    command.guild
  );

  const handlerKeys = [command.commandId];

  if (command.isChatInputCommand()) {
    const subCommandGroup = command.options.getSubcommandGroup(false);
    handlerKeys.push(subCommandGroup ?? "");

    const subCommand = command.options.getSubcommand(false);
    if (subCommand) handlerKeys.push(subCommand);
  }

  return {
    member: member,
    handlerKeys,
    isDirectMessage: command.channel?.type === ChannelType.DM ?? false,
  };
};

const buildCommand = (
  options: SlashCommandHandlerOptions,
  builderCache: Record<string, SlashCommandBuilder>,
  groupBuilderCache: Record<string, SlashCommandSubcommandGroupBuilder>
) => {
  const builder =
    builderCache[options.root] ??
    new SlashCommandBuilder()
      .setName(options.root)
      .setDescription(options.description);

  const { subCommand, subCommandGroup } = options;

  const subCommandBuilder = (input: SlashCommandSubcommandBuilder) => {
    input.setName(subCommand ?? "");
    input.setDescription(options.description);
    addOptions(input, options.options);
    return input;
  };

  if (!subCommand) {
    addOptions(builder, options.options);
  } else if (subCommandGroup) {
    const key = `${options.root}_${options.subCommandGroup}`;

    const subCommandgroupBuilder =
      groupBuilderCache[key] ??
      new SlashCommandSubcommandGroupBuilder()
        .setName(subCommandGroup)
        .setDescription(options.description);

    subCommandgroupBuilder.addSubcommand(subCommandBuilder);

    if (!groupBuilderCache[key]) {
      builder.addSubcommandGroup(subCommandgroupBuilder);
      groupBuilderCache[key] = subCommandgroupBuilder;
    }
  } else if (subCommand) {
    builder.addSubcommand(subCommandBuilder);
  }

  builderCache[options.root] ??= builder;
};

interface RegistrationResponseItem {
  id: string;
  name: string;
}

interface RegistrationResult {
  tree: StringIndexedHIOCTree<DiscordEvent.SLASH_COMMAND>;
  nameIdMap?: Record<string, Snowflake>;
}

export const registerSlashCommands = async (
  commandTree: StringIndexedHIOCTree<DiscordEvent.SLASH_COMMAND>
): Promise<RegistrationResult> => {
  const logger = createYesBotLogger(
    "event-distribution",
    "register-slash-commands"
  );

  const allOptions = getAllOptions(commandTree);

  if (allOptions.length === 0) {
    logger.info("No slash commands registered; skipping API call!");
    return { tree: commandTree };
  }

  logger.info(`Registering ${allOptions.length} slash commands`);

  const builderCache: Record<string, SlashCommandBuilder> = {};
  const groupBuilderCache: Record<string, SlashCommandSubcommandGroupBuilder> =
    {};

  allOptions.forEach((option) =>
    buildCommand(option, builderCache, groupBuilderCache)
  );
  const commands = Object.values(builderCache).map((builder) =>
    builder.toJSON()
  );

  const rest = new REST({ version: "10" }).setToken(process.env.BOT_TOKEN);

  try {
    const result = (await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands }
    )) as RegistrationResponseItem[];

    const newCommandTree: StringIndexedHIOCTree<DiscordEvent.SLASH_COMMAND> =
      {};
    const nameIdMap: Record<string, Snowflake> = {};

    for (const item of result) {
      newCommandTree[item.id] = commandTree[item.name];
      nameIdMap[item.name] = item.id;
    }

    logger.info(`Finished registering ${allOptions.length} slash commands`);

    return { tree: newCommandTree, nameIdMap };
  } catch (e) {
    logger.error("Failed registering slash commands, exception was ", e);

    return { tree: commandTree };
  }
};
