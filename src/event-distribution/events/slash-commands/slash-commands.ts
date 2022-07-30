import { REST } from "@discordjs/rest";
import { APIApplicationCommandBasicOption } from "discord-api-types/payloads/v10";
import { Routes } from "discord-api-types/rest";
import {
  ChannelType,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
  SlashCommandSubcommandGroupBuilder,
} from "discord.js";
import { createYesBotLogger } from "../../../log";
import { addToTree, ensureGuildMemberOrNull } from "../../helper";
import {
  AddEventHandlerFunction,
  BaseOptions,
  DiscordEvent,
  ExtractInfoForEventFunction,
  HandlerFunctionFor,
} from "../../types/base";
import { StringIndexedHIOCTree } from "../../types/hioc";
import { addOptions } from "./add-options";

export interface SlashCommandHandlerOptions extends BaseOptions {
  event: DiscordEvent.SLASH_COMMAND;

  root: string;
  subCommand?: string;
  subCommandGroup?: string;

  description: string;
  options?: APIApplicationCommandBasicOption[];
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
  addToTree(
    [options.root, options.subCommandGroup ?? "", options.subCommand ?? ""],
    { options, ioc },
    tree
  );
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

const getAllOptions = (
  tree: StringIndexedHIOCTree<DiscordEvent.SLASH_COMMAND>
): SlashCommandHandlerOptions[] => {
  let result: SlashCommandHandlerOptions[] = [];

  for (const key in tree) {
    const node = tree[key];
    const toPush = Array.isArray(node)
      ? node.map((l) => l.options)
      : getAllOptions(node);
    result = [...result, ...toPush];
  }

  return result;
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

export const registerSlashCommands = async (
  tree: StringIndexedHIOCTree<DiscordEvent.SLASH_COMMAND>
): Promise<StringIndexedHIOCTree<DiscordEvent.SLASH_COMMAND>> => {
  const logger = createYesBotLogger(
    "event-distribution",
    "register-slash-commands"
  );

  const allOptions = getAllOptions(tree);

  if (allOptions.length === 0) {
    logger.info("No slash commands registered; skipping API call!");
    return tree;
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

    const newTree: StringIndexedHIOCTree<DiscordEvent.SLASH_COMMAND> = {};

    for (const item of result) {
      newTree[item.id] = tree[item.name];
    }

    logger.info(`Finished registering ${allOptions.length} slash commands`);

    return newTree;
  } catch (e) {
    logger.error("Failed registering slash commands, exception was ", e);

    return tree;
  }
};
