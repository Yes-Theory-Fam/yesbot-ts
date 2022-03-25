import {
  SlashCommandBuilder,
  SlashCommandIntegerOption,
  SlashCommandNumberOption,
  SlashCommandStringOption,
  SlashCommandSubcommandBuilder,
} from "@discordjs/builders";
import {
  APIApplicationCommandBasicOption,
  APIApplicationCommandOptionChoice,
  ApplicationCommandOptionType,
} from "discord-api-types/payloads/v9/_interactions/_applicationCommands/chatInput";

export type SlashCommandOptionBase =
  SlashCommandSubcommandBuilder["options"][0];

const transformAPIChoicesToOptionChoices = <T extends string | number>(
  choices: APIApplicationCommandOptionChoice<T>[]
): [name: string, value: T][] =>
  choices.map(({ name, value }) => [name, value]);

type ChoiceType =
  | ApplicationCommandOptionType.String
  | ApplicationCommandOptionType.Number
  | ApplicationCommandOptionType.Integer;

type ChoiceOption<
  T extends string | number,
  TType extends ChoiceType
> = T extends string
  ? SlashCommandStringOption
  : (SlashCommandIntegerOption | SlashCommandNumberOption) & { type: TType };

const addChoices = <T extends string | number, TType extends ChoiceType>(
  option: ChoiceOption<T, TType> & {
    setChoices: (
      choices: [name: string, value: T][]
    ) => Omit<ChoiceOption<T, TType>, "setAutocomplete">;
  },
  data:
    | { autocomplete?: false; choices?: APIApplicationCommandOptionChoice<T>[] }
    | { autocomplete: true }
): ChoiceOption<T, TType> => {
  const withAutoCompleteSet = option.setAutocomplete(
    data.autocomplete ?? false
  );

  return data.autocomplete === false
    ? (withAutoCompleteSet.setChoices(
        transformAPIChoicesToOptionChoices(data.choices)
      ) as ChoiceOption<T, TType>)
    : (withAutoCompleteSet as unknown as ChoiceOption<T, TType>);
};

const addMinMax = <
  T extends
    | ApplicationCommandOptionType.Number
    | ApplicationCommandOptionType.Integer
>(
  option: ChoiceOption<number, T>,
  data: { min_value?: number; max_value?: number }
): ChoiceOption<number, T> => {
  const withMinValueSet =
    typeof data.min_value === "number"
      ? option.setMinValue(data.min_value)
      : option;
  return typeof data.max_value === "number"
    ? withMinValueSet.setMaxValue(data.max_value)
    : withMinValueSet;
};

const addOption = (
  builder: SlashCommandBuilder | SlashCommandSubcommandBuilder,
  option: APIApplicationCommandBasicOption
) => {
  const required = option.required ?? false;

  const addDefaults = <T extends SlashCommandOptionBase>(o: T) =>
    o
      .setName(option.name)
      .setDescription(option.description)
      .setRequired(required);

  switch (option.type) {
    case ApplicationCommandOptionType.Boolean:
      builder.addBooleanOption(addDefaults);
      break;
    case ApplicationCommandOptionType.Channel:
      builder.addChannelOption((o) =>
        addDefaults(o).addChannelTypes(option.channel_types)
      );
      break;
    case ApplicationCommandOptionType.Role:
      builder.addRoleOption(addDefaults);
      break;
    case ApplicationCommandOptionType.User:
      builder.addUserOption(addDefaults);
      break;
    case ApplicationCommandOptionType.Mentionable:
      builder.addMentionableOption(addDefaults);
      break;
    case ApplicationCommandOptionType.String:
      builder.addStringOption((o) => {
        const withDefaults = addDefaults(o);
        return addChoices(withDefaults, option);
      });
      break;
    case ApplicationCommandOptionType.Number:
      builder.addNumberOption((o) => {
        const withDefaults = addDefaults(o);
        return addChoices(withDefaults, option);
      });
      break;
    case ApplicationCommandOptionType.Integer:
      builder.addIntegerOption((o) => {
        const withDefaults = addDefaults(o);
        const withChoices = addChoices(withDefaults, option);
        return addMinMax(withChoices, option);
      });
      break;
  }

  return builder;
};

export const addOptions = (
  builder: SlashCommandBuilder | SlashCommandSubcommandBuilder,
  options: APIApplicationCommandBasicOption[] | undefined
) => {
  if (!options) return;

  for (const option of options) {
    addOption(builder, option);
  }
};
