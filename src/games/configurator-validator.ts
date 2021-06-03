import { unicodeEmojiRegex } from "../common/tools";

type TypeToKeyType<T> = T extends boolean
  ? "boolean"
  : T extends number
  ? "number"
  : T extends string
  ? "emoji" | "string"
  : never;

export type NodeProperties = {
  emoji: string;
  displayName: string;
  description?: string;
};

export type Affixable = {
  prefix?: string;
  suffix?: string;
};

type ConfigurationKeyBase<T> = {
  defaultValue: T;
  type: TypeToKeyType<T>;
} & NodeProperties;

/**
 * BaseOptions type definition for a configuration key that allows selection of the result from a range of options
 */
export type SelectionConfigurationKey<T> = ConfigurationKeyBase<T> & {
  options: "selection";
  selection: T[];
};

/**
 * Type definition for configuration keys that allow user input
 */
export type InputConfigurationKey<T> = ConfigurationKeyBase<T> & {
  options: "input";
};

/**
 * Type definition for configuration keys that allow selection in a range from min to max
 */
export type NumberRangeConfigurationKey = ConfigurationKeyBase<number> & {
  options: "range";
  min: number;
  max: number;
} & Affixable;

export type BooleanValueConfigurationKey = ConfigurationKeyBase<boolean> & {
  options: "selection";
};

type StringValueConfigurationKey = ConfigurationKeyBase<string> &
  (SelectionConfigurationKey<string> | InputConfigurationKey<string>);
type EmojiValueConfigurationKey = ConfigurationKeyBase<string> &
  (SelectionConfigurationKey<string> | InputConfigurationKey<string>);

type NumberValueConfigurationKey =
  | (SelectionConfigurationKey<number> & Affixable)
  | InputConfigurationKey<number>
  | NumberRangeConfigurationKey;

type ConfigurationKey<T> = T extends number
  ? NumberValueConfigurationKey
  : T extends string
  ? StringValueConfigurationKey | EmojiValueConfigurationKey
  : T extends boolean
  ? BooleanValueConfigurationKey
  : never;

export type TypedConfigurationKey<T> = ConfigurationKey<T> &
  (
    | NumberValueConfigurationKey
    | StringValueConfigurationKey
    | EmojiValueConfigurationKey
    | BooleanValueConfigurationKey
  );

export type ConfiguratorConfigNode<T> = {
  config: ConfiguratorConfig<T>;
  properties: NodeProperties;
};

export type ConfigurationNode<T> =
  | ConfiguratorConfigNode<T>
  | TypedConfigurationKey<T>;

/**
 * A ConfiguratorConfig is a nested object of ConfigurationKeys allowing for nested configurations for games.
 */
export type ConfiguratorConfig<T> = {
  [key in keyof T]?: ConfigurationNode<T[key]>;
};

// Let's pretend that no-one adds a session config key called defaultValue until we have a saner option for this...
export const isConfigKey = <K>(
  keyConfig: ConfigurationNode<K>
): keyConfig is TypedConfigurationKey<K> => "defaultValue" in keyConfig;

export const isConfiguratorConfig = <K>(
  keyConfig: ConfigurationNode<K>
): keyConfig is ConfiguratorConfigNode<K> => !("defaultValue" in keyConfig);

export class ConfiguratorValidator {
  /**
   * More than 20 selection options throw an error
   * max < min throws an error
   * negative min/max throws an error
   * Range larger than 100 entries throws an error (for now)
   * Non-emoji strings in "emoji" type config keys throw an error
   */
  public validateConfig<T>(config?: ConfiguratorConfig<T>) {
    if (!config) {
      return;
    }

    for (const key in config) {
      const keyConfig = config[key];

      if (isConfiguratorConfig(keyConfig)) {
        this.validateConfig(keyConfig.config);
        continue;
      }

      if (!isConfigKey(keyConfig)) {
        continue;
      }

      switch (keyConfig.type) {
        case "number":
          this.validateNumberKey(keyConfig as NumberValueConfigurationKey, key);
          break;
        case "string":
          this.validateStringKey(keyConfig as StringValueConfigurationKey, key);
          break;
        case "emoji":
          this.validateEmojiKey(keyConfig as EmojiValueConfigurationKey, key);
          break;
        case "boolean":
          break;
        default:
          throw new Error("How the hell did you get here?!");
      }
    }

    if (Object.keys(config).length > 20) {
      throw new Error("More than 20 configurable options!");
    }

    return;
  }

  private validateNumberKey(
    config: NumberValueConfigurationKey,
    keyName: string
  ) {
    if (config.options === "selection") {
      this.validateSelectionKey(config, keyName);
    } else if (config.options === "range") {
      const { min, max, defaultValue } = config;
      if (min < 0) {
        throw new Error(
          `Min value ${min} configured for key ${keyName} is negative!`
        );
      }

      if (max < 0) {
        throw new Error(
          `Max value ${max} configured for key ${keyName} is negative!`
        );
      }

      if (max < min) {
        throw new Error(
          `Max value ${max} for key ${keyName} is smaller than min value ${min}!`
        );
      }

      if (defaultValue > max || defaultValue < min) {
        throw new Error(
          `Default value ${defaultValue} defined for key ${keyName} is not in the range from ${min} - ${max}!`
        );
      }

      if (max - min > 100) {
        throw new Error(
          `Range from ${min} to ${max} for key ${keyName} covers more than 100 values!`
        );
      }
    }
  }

  private validateStringKey(
    config: StringValueConfigurationKey,
    keyName: string
  ) {
    if (config.options === "selection") {
      this.validateSelectionKey(config, keyName);
    }
  }

  private validateEmojiKey(
    config: EmojiValueConfigurationKey,
    keyName: string
  ) {
    const throwNotEmoji = (notEmoji: string, location: string) => {
      throw new Error(
        `${notEmoji} in the ${location} for key ${keyName} is not an emoji!`
      );
    };

    if (config.options === "selection") {
      this.validateSelectionKey(config, keyName);
      for (const maybeEmoji of config.selection) {
        if (!maybeEmoji.match(unicodeEmojiRegex)) {
          throwNotEmoji(maybeEmoji, "list of options");
        }
      }
    }

    const { defaultValue } = config;
    if (!defaultValue.match(unicodeEmojiRegex)) {
      throwNotEmoji(defaultValue, "default value");
    }
  }

  private validateSelectionKey<T>(
    config: SelectionConfigurationKey<T>,
    keyName: string
  ) {
    const { selection, defaultValue } = config;
    if (selection.length < 2) {
      throw new Error(
        `Less than 2 options for key ${keyName}. Not much of a selection then, is it?`
      );
    }

    if (selection.length > 20) {
      throw new Error(`More than 20 options for key ${keyName}!`);
    }

    if (!selection.includes(defaultValue)) {
      throw new Error(
        `Default value ${defaultValue} is not included in the selection for key ${keyName}!`
      );
    }
  }
}
