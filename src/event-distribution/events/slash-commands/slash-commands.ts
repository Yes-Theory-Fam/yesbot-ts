import {
  ChannelType,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
  SlashCommandSubcommandGroupBuilder,
} from "discord.js";
import { addToTree, ensureGuildMemberOrNull } from "../../helper.js";
import {
  AddEventHandlerFunction,
  BaseOptions,
  DiscordEvent,
  ExtractInfoForEventFunction,
  HandlerFunctionFor,
} from "../../types/base.js";
import {
  addOptions,
  APIApplicationCommandBasicOptionWithAutoCompleteHandler,
} from "./add-options.js";

export interface SlashCommandHandlerOptions extends BaseOptions {
  event: DiscordEvent.SLASH_COMMAND;

  root: string;
  subCommand?: string;
  subCommandGroup?: string;

  global?: boolean;
  allowDms?: boolean;

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

export const buildSlashCommand = (
  options: SlashCommandHandlerOptions,
  builderCache: Record<string, SlashCommandBuilder>,
  groupBuilderCache: Record<string, SlashCommandSubcommandGroupBuilder>
) => {
  const builder =
    builderCache[options.root] ??
    new SlashCommandBuilder()
      .setDMPermission(options.global && (options.allowDms ?? false))
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
