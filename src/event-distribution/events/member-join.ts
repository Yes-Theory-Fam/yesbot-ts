import {
  AddEventHandlerFunction,
  BaseOptions,
  DiscordEvent,
  ExtractInfoForEventFunction,
  HandlerFunctionFor,
} from "../types/base";
import { GuildMember, PartialGuildMember } from "discord.js";
import { HIOC } from "../types/hioc";

export interface MemberJoinEventHandlerOptions extends BaseOptions {
  event: DiscordEvent.MEMBER_JOIN;
}

export type MemberJoinArgument = GuildMember | PartialGuildMember;

export type MemberJoinHandlerFunction<T extends DiscordEvent> =
  HandlerFunctionFor<T, DiscordEvent.MEMBER_JOIN, [MemberJoinArgument]>;
const baseKey = "";

export const addMemberJoinHandler: AddEventHandlerFunction<
  MemberJoinEventHandlerOptions
> = (options, ioc, tree) => {
  tree[baseKey] ??= [];
  const handlers = tree[baseKey] as HIOC<DiscordEvent.MEMBER_JOIN>[];
  handlers.push({ ioc, options });
};

export const extractMemberJoinInfo: ExtractInfoForEventFunction<
  DiscordEvent.MEMBER_JOIN
> = (member: MemberJoinArgument) => {
  return { handlerKeys: [baseKey], member, isDirectMessage: false };
};
