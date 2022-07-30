import {
  AddEventHandlerFunction,
  DiscordEvent,
  ExtractInfoForEventFunction,
  HandlerFunctionFor,
  MessageRelatedOptions,
} from "../types/base";
import {
  ButtonInteraction,
  Client,
  Guild,
  GuildMember,
  Message,
} from "discord.js";
import {
  addToTree,
  collectChannelDefinitions,
  ensureGuildMemberOrNull,
  withMessageRelatedInfo,
} from "../helper";
import { APIGuildMember, APIMessage } from "discord-api-types/v10";

export interface ButtonClickedHandlerOptions extends MessageRelatedOptions {
  event: DiscordEvent.BUTTON_CLICKED;
  customId: string;
}

export type ButtonClickedHandlerFunction<T extends DiscordEvent> =
  HandlerFunctionFor<T, DiscordEvent.BUTTON_CLICKED, ButtonInteraction>;

export const addButtonClickedHandler: AddEventHandlerFunction<
  ButtonClickedHandlerOptions
> = (options, ioc, tree) => {
  const combinedChannels = collectChannelDefinitions(options);

  for (const channel of combinedChannels) {
    addToTree([channel, options.customId], { options, ioc }, tree);
  }
};

export const extractButtonClickedInfo: ExtractInfoForEventFunction<
  DiscordEvent.BUTTON_CLICKED
> = (button: ButtonInteraction) => {
  let message = button.message;
  if (!(message instanceof Message)) {
    message = Reflect.construct(Message, [button.client, message]) as Message;
  }

  const member = ensureGuildMemberOrNull(
    button.member,
    button.client,
    button.guild
  );

  return withMessageRelatedInfo(message, member, (channelId) => [
    channelId,
    button.customId,
  ]);
};
