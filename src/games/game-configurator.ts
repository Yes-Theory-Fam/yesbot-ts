import {
  EmbedFieldData,
  Message,
  MessageEmbed,
  MessageReaction,
  Snowflake,
  TextChannel,
} from "discord.js";
import {
  Affixable,
  BooleanValueConfigurationKey,
  ConfigurationNode,
  ConfiguratorConfig,
  ConfiguratorConfigNode,
  InputConfigurationKey,
  isConfigKey,
  NumberRangeConfigurationKey,
  SelectionConfigurationKey,
  TypedConfigurationKey,
} from "./configurator-validator";
import { SessionConfig } from "./game-session";
import Tools, { unicodeEmojiRegex } from "../common/tools";

const checkmark = "✅";

type NodeWithName<K> = {
  node: ConfigurationNode<K[keyof K]>;
  fieldName: keyof K;
};

type Step = {
  min: number;
  max: number;
};

/**
 * Class taking in a configuration which handles the embeds and inputs for configuring the game.
 */
export class GameConfigurator<GameConfig extends SessionConfig> {
  constructor(
    private configuratorConfig: ConfiguratorConfig<GameConfig>,
    private gameName: string,
    private leaderId: Snowflake,
    private channel: TextChannel
  ) {}

  private static nodeToField<K>(
    node: ConfigurationNode<K>,
    key: string,
    value: K
  ): EmbedFieldData {
    const getValue = (
      displayName?: string,
      description?: string,
      value?: string
    ) =>
      `${displayName ?? key}${description ? ": " + description : ""}${
        value ?? ""
      }`;

    if (isConfigKey(node)) {
      const getValueString = () => {
        if (value === undefined || value === null) {
          return "";
        }

        let valueString = value.toString();
        if (node.type === "string") {
          valueString = `"${valueString}"`;
        }

        if ("suffix" in node || "prefix" in node) {
          valueString = `${node.prefix ?? ""}${valueString}${
            node.suffix ?? ""
          }`;
        }

        return ` (${valueString})`;
      };

      return {
        name: node.emoji,
        value: getValue(node.displayName, node.description, getValueString()),
      };
    }

    const { emoji, displayName, description } = node.properties;
    return { name: emoji, value: getValue(displayName, description) };
  }

  private static getEmoji<K>(node: ConfigurationNode<K>): string {
    if (isConfigKey(node)) {
      return node.emoji;
    }

    return node.properties.emoji;
  }

  // If someone has a better idea for this, please go ahead; I gave up after 5

  public async createConfiguration(): Promise<Partial<GameConfig>> {
    // TODO Add logic to the validator that emojis may not double on the same layer
    const rootNode: ConfigurationNode<GameConfig> = {
      config: this.configuratorConfig,
      properties: {
        emoji: "",
        displayName: "Main Menu",
      },
    };

    return this.getConfiguration(rootNode);
  }

  private getConfiguration<K>(
    node: ConfigurationNode<K>,
    message?: Message
  ): Promise<K> {
    if (isConfigKey(node)) {
      return this.getKeyConfiguration(node, message);
    }

    return this.getSubConfiguration(node, message);
  }

  //  attempts and I am getting desperate
  private getKeyConfiguration<K>(
    node: TypedConfigurationKey<K>,
    message?: Message
  ): Promise<K> {
    if (node.type === "string") {
      switch (node.options) {
        case "input":
          return this.getStringInput(node, message) as unknown as Promise<K>;
        case "selection":
          return this.getStringSelection(
            node,
            message
          ) as unknown as Promise<K>;
      }
    }

    if (node.type === "emoji") {
      switch (node.options) {
        case "input":
          return this.getEmojiInput(node, message) as unknown as Promise<K>;
        case "selection":
          return this.getEmojiSelection(node, message) as unknown as Promise<K>;
      }
    }

    if (node.type === "number") {
      switch (node.options) {
        case "input":
          return this.getNumberInput(node, message) as unknown as Promise<K>;
        case "selection":
          return this.getNumberSelection(
            node,
            message
          ) as unknown as Promise<K>;
        case "range":
          return this.getNumberRange(node, message) as unknown as Promise<K>;
      }
    }

    if (node.type === "boolean") {
      switch (node.options) {
        case "selection":
          return this.getBooleanSelection(
            node,
            message
          ) as unknown as Promise<K>;
      }
    }

    throw `Combination of type ${node.type} and options ${node.options} is not supported.`;
  }

  private numberEmojis(amount: number): string[] {
    if (amount > 10) {
      throw new Error(
        "Amount of number emojis requested may not exceed 10. Given: " + amount
      );
    }

    const numberEmojiConverter = 0x20e3;
    return Array(amount)
      .fill(undefined)
      .map((_, i) => i + 48)
      .map((c) => String.fromCharCode(c, numberEmojiConverter));
  }

  private letterEmojis(amount: number): string[] {
    const unicodeOffset = 0x1f1e6; //Regional Indicator A

    return Array(amount)
      .fill(undefined)
      .map((_, i) => i + unicodeOffset)
      .map((c) => String.fromCodePoint(c));
  }

  private async prepEmbed(
    embed: MessageEmbed,
    message?: Message
  ): Promise<Message> {
    const result =
      (await message?.edit({ embeds: [embed] })) ??
      (await this.channel.send({ embeds: [embed] }));
    await result.reactions.removeAll();
    return result;
  }

  private getBaseEmbed(node: TypedConfigurationKey<any>): MessageEmbed {
    const embed = new MessageEmbed();
    embed.setTitle(
      [node.displayName, node.description].filter(Boolean).join(": ")
    );

    return embed;
  }

  private async getNumberSelection(
    node: SelectionConfigurationKey<number> & Affixable,
    message?: Message
  ): Promise<number> {
    const cleaned = node.selection
      .sort((a, b) => a - b)
      .filter((v, i, a) => a.indexOf(v) === i);
    const useNumberEmojis =
      cleaned.length < 10 && cleaned[cleaned.length - 1] < 10;

    const amount = cleaned.length;
    const numberEmojis = this.numberEmojis(10);
    const reactions = useNumberEmojis
      ? cleaned.map((v) => numberEmojis[v])
      : this.letterEmojis(amount);

    const embed = this.getBaseEmbed(node);
    const selections: Record<string, number> = {};
    for (let i = 0; i < amount; i++) {
      const emoji = reactions[i];
      const text = `${node.prefix ?? ""}${cleaned[i]}${node.suffix ?? ""}`;
      embed.addField(reactions[i], text);
      selections[emoji] = cleaned[i];
    }

    message = await this.prepEmbed(embed, message);
    const selection = await Tools.addVote(
      message,
      reactions,
      [this.leaderId],
      true,
      false
    );

    return selections[selection.emoji.name];
  }

  private async getEmojiSelection(
    node: SelectionConfigurationKey<string>,
    message?: Message
  ): Promise<string> {
    const cleaned = node.selection.filter((v, i, a) => a.indexOf(v) === i);

    const embed = this.getBaseEmbed(node);
    for (const emoji of cleaned) {
      embed.addField(emoji, "\u200B");
    }

    message = await this.prepEmbed(embed, message);
    const result = await Tools.addVote(
      message,
      cleaned,
      [this.leaderId],
      true,
      false
    );

    return result.emoji.name;
  }

  private async getStringSelection(
    node: SelectionConfigurationKey<string>,
    message?: Message
  ): Promise<string> {
    const cleaned = node.selection.filter((v, i, a) => a.indexOf(v) === i);

    const reactions = this.letterEmojis(cleaned.length);
    const selections: Record<string, string> = {};
    const embed = this.getBaseEmbed(node);

    for (let i = 0; i < reactions.length; i++) {
      const emoji = reactions[i];
      embed.addField(emoji, cleaned[i]);
      selections[emoji] = cleaned[i];
    }

    message = await this.prepEmbed(embed, message);
    const selection = await Tools.addVote(
      message,
      reactions,
      [this.leaderId],
      true,
      false
    );

    return selections[selection.emoji.name];
  }

  private async getBooleanSelection(
    node: BooleanValueConfigurationKey,
    message?: Message
  ): Promise<boolean> {
    const checkmark = "✅";
    const cross = "❌";
    const reactions = [checkmark, cross];

    const embed = this.getBaseEmbed(node);
    embed.addField(checkmark, "\u200B", true);
    embed.addField(cross, "\u200B", true);

    message = await this.prepEmbed(embed, message);
    const selection = await Tools.addVote(
      message,
      reactions,
      [this.leaderId],
      true,
      false
    );

    const emoji = selection.emoji.name;
    if (emoji === cross) return false;
    return emoji === checkmark;
  }

  private async getNumberInput(
    node: InputConfigurationKey<number>,
    message?: Message
  ): Promise<number> {
    const embed = this.getBaseEmbed(node);
    embed.setTitle(embed.title + ", please send the number you want to use!");

    message = await this.prepEmbed(embed, message);
    const filter = (message: Message) => message.author.id === this.leaderId;

    let maxTries = 10;
    while (maxTries--) {
      const channel = message.channel;
      const input = await channel.awaitMessages({
        filter,
        max: 1,
        time: 60 * 1000,
      });
      const single = input.first();

      if (!single) {
        throw new Error("You didn't answer in a minute.");
      }

      await single.delete();

      try {
        return Number(single.content);
      } catch (e) {
        await Tools.handleUserError(single, "That is not a number, try again!");
      }
    }

    throw new Error("You didn't put in a number in 10 tries, I give up.");
  }

  private async getEmojiInput(
    node: InputConfigurationKey<string>,
    message?: Message
  ): Promise<string> {
    const embed = this.getBaseEmbed(node);
    embed.setTitle(embed.title + ", please send the emoji you want to use!");

    message = await this.prepEmbed(embed, message);
    const filter = (message: Message) => message.author.id === this.leaderId;

    let maxTries = 10;
    while (maxTries--) {
      const channel = message.channel;
      const input = await channel.awaitMessages({
        filter,
        max: 1,
        time: 60 * 1000,
      });
      const single = input.first();

      if (!single) {
        throw new Error("You didn't answer in a minute.");
      }

      const maybeEmoji = single.content.replace(/^\p{P}*/u, "");

      if (unicodeEmojiRegex.test(maybeEmoji) && !/\d+/.test(maybeEmoji)) {
        await single.delete();
        return maybeEmoji;
      }

      await Tools.handleUserError(
        single,
        "That is not a valid emoji, try again!"
      );
    }

    throw new Error("You didn't put in an emoji in 10 tries, I give up.");
  }

  private async getStringInput(
    node: InputConfigurationKey<string>,
    message?: Message
  ): Promise<string> {
    const embed = this.getBaseEmbed(node);
    embed.setTitle(embed.title + ", please send the string you want to use!");

    message = await this.prepEmbed(embed, message);
    const filter = (message: Message) => message.author.id === this.leaderId;
    const input = await message.channel.awaitMessages({
      filter,
      max: 1,
      time: 60 * 1000,
    });
    const single = input.first();

    if (!single) {
      throw new Error("You didn't answer in a minute.");
    }

    await single.delete();

    return single.content;
  }

  private async getNumberRange(
    node: NumberRangeConfigurationKey,
    message?: Message
  ): Promise<number> {
    const back = "◀️";
    const previousSteps: Step[] = [];
    let currentStep: Step = node;

    while (true) {
      const { min, max } = currentStep;
      const { steps, stepSize } = this.getSteps(min, max);

      const relevantDigit = min.toString().length - stepSize.toString().length;
      const offset = Number(min.toString()[relevantDigit]);
      const emojis = [...this.numberEmojis(10), ...this.numberEmojis(10)];
      const reactions = emojis.slice(offset, steps.length + offset);

      const selections: Record<string, Step> = {};
      const embed = this.getBaseEmbed(node);
      for (let i = 0; i < steps.length; i++) {
        const emoji = reactions[i];
        const step = steps[i];
        const { max, min } = step;
        const rangeString = max === min ? max.toString() : `${min}-${max}`;
        const text =
          stepSize === 1
            ? `${node.prefix ?? ""}${rangeString}${node.suffix ?? ""}`
            : rangeString;
        embed.addField(emoji, text);
        selections[emoji] = step;
      }

      message = await this.prepEmbed(embed, message);

      const voteOptions = previousSteps.length
        ? [back, ...reactions]
        : reactions;
      const selection = await Tools.addVote(
        message,
        voteOptions,
        [this.leaderId],
        true,
        false
      );
      const emoji = selection.emoji.name;

      if (emoji === back) {
        currentStep = previousSteps.pop();
        continue;
      }

      const step = selections[emoji];
      if (step.min === step.max) {
        return step.min;
      }

      previousSteps.push(currentStep);
      currentStep = step;
    }
  }

  private getSteps(
    min: number,
    max: number
  ): { steps: Step[]; stepSize: number; offset: number } {
    const range = max - min + 1;

    // Since we have 10 digits, we can display a range of 10 with stepSize 1
    //  same with 100 with stepSize 10, etc, so we subtract 1 from the range to
    //  get the correct value for the stepSize.
    const stepSize = 10 ** ((range - 1).toString().length - 1);
    let stepCount = Math.ceil(range / stepSize);
    if (range === stepSize) {
      ++stepCount;
    }

    const steps = [];
    const offset = Math.floor(min / stepSize);
    for (let i = 0; i < stepCount; i++) {
      const calcIndex = i + offset;
      const step = {
        min: calcIndex * stepSize,
        max: (calcIndex + 1) * stepSize - 1,
      };

      if (i === 0) {
        step.min = min;
      }

      if (i === stepCount - 1) {
        step.max = max;
      }

      steps.push(step);
    }

    return { steps, stepSize, offset };
  }

  private async getSubConfiguration<K>(
    node: ConfiguratorConfigNode<K>,
    message?: Message
  ): Promise<K> {
    // If we are not passed a message, that is the root of the configuration
    //  If we complete this, we want to delete the configuration embed message.
    const root = !message;

    const configurationKeys = Object.keys(node.config) as (keyof K)[];
    const defaults = this.getDefaultValue(node);

    // For easier access to the configurations per field, we should restructure
    //  them to { emoji: configuration }
    const restructured = this.restructureConfiguration(node);
    const emojis = Object.keys(restructured);

    let pick: MessageReaction;
    do {
      const sendMissingReactionWarning = async (note: string) => {
        const warning = await this.channel.send(
          `Remember to put in a value fast enough; ${note}`
        );
        setTimeout(() => warning.delete(), 10000);
      };

      const embedFields = configurationKeys.map((key) =>
        GameConfigurator.nodeToField(
          node.config[key],
          key.toString(),
          defaults[key]
        )
      );

      const embed = this.buildSelectionEmbed(embedFields);

      message = await this.prepEmbed(embed, message);

      try {
        pick = await Tools.addVote(
          message,
          [checkmark, ...emojis],
          [this.leaderId],
          true,
          false
        );
      } catch (e) {
        // We assume this to be a timeout waiting for a reaction
        await sendMissingReactionWarning(
          root
            ? "I will start the game with the current configuration!"
            : "I left this category at its set values and you can continue configuring others."
        );
        if (root) {
          await message.delete();
        }

        return defaults;
      }

      if (pick.emoji.name === checkmark) {
        break;
      }

      const { fieldName, node: pickedNode } = restructured[pick.emoji.name];
      try {
        defaults[fieldName] = await this.getConfiguration(pickedNode, message);
      } catch (e) {
        // We assume this to be a timeout waiting for a reaction or message
        await sendMissingReactionWarning(
          `I left the last setting at its old value.`
        );
      }
    } while (true);

    if (root) {
      await message.delete();
    }

    return defaults;
  }

  private buildSelectionEmbed(fields: EmbedFieldData[]): MessageEmbed {
    const embed = new MessageEmbed();
    const inlineFields = fields.map((value) => ({ ...value, inline: true }));
    embed.addFields(inlineFields);
    embed.setColor("BLUE");

    embed.setTitle(this.gameName);

    return embed;
  }

  private restructureConfiguration<K>(
    configuratorConfig: ConfiguratorConfigNode<K>
  ): Record<string, NodeWithName<K>> {
    if (isConfigKey(configuratorConfig)) {
      throw new Error("Attempted to restructure a single ConfigurationKey");
    }

    const result: Record<string, NodeWithName<K>> = {};
    const keys = Object.keys(configuratorConfig.config) as (keyof K)[];

    for (const key of keys) {
      const node = configuratorConfig.config[key];
      const emoji = GameConfigurator.getEmoji(node);
      result[emoji] = { node, fieldName: key };
    }

    return result;
  }

  private getDefaultValue<K>(node: ConfigurationNode<K>): K {
    if (isConfigKey(node)) {
      return node.defaultValue as unknown as K;
    }

    const result: Partial<K> = {};
    const config = node.config;
    const keys = Object.keys(config) as (keyof K)[];
    for (const key of keys) {
      result[key] = this.getDefaultValue(config[key]);
    }

    return result as K;
  }
}
