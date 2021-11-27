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
  withMessageRelatedInfo,
} from "../helper";
import { APIGuildMember, APIMessage } from "discord-api-types";

export interface ButtonClickedHandlerOptions extends MessageRelatedOptions {
  event: DiscordEvent.BUTTON_CLICKED;
  customId?: string;
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

const ensureGuildMemberOrNull = (
  member: GuildMember | APIGuildMember | null,
  client: Client,
  guild: Guild | null
): GuildMember | null => {
  if (!member) return null;

  if (member instanceof GuildMember) {
    return member;
  }

  if (!guild) {
    throw new Error(
      "Could not instantiate GuildMember from raw data; missing guild from button interaction"
    );
  }

  return new (GuildMember as unknown as new (
    client: Client,
    member: APIGuildMember,
    guild: Guild
  ) => GuildMember)(client, member, guild);
};

export const extractButtonClickedInfo: ExtractInfoForEventFunction<
  DiscordEvent.BUTTON_CLICKED
> = (button: ButtonInteraction) => {
  let message = button.message;
  if (!(message instanceof Message)) {
    message = new (Message as unknown as new (
      client: Client,
      message: APIMessage
    ) => Message)(button.client, message);
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
