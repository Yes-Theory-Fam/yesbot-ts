import { AutocompleteInteraction, LocalizationMap } from "discord.js";
import { PromiseOr } from "../../types/handler";

type HandlerResult<T> = {
  name: string;
  value: T;
  nameLocalizations?: LocalizationMap;
};

export type AutocompleteHandler<T extends string | number> = (
  currentInput: string,
  interaction: AutocompleteInteraction
) => PromiseOr<HandlerResult<T>[]>;
