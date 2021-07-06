import {
  AddEventHandlerFunction,
  DiscordEvent,
  ExtractInfoForEventFunction,
  HandlerFunctionFor,
} from "../types/base";
import { GuildMember, PartialGuildMember } from "discord.js";
import { HIOC } from "../types/hioc";

export interface MemberLeaveEventHandlerOptions {
  event: DiscordEvent.MEMBER_LEAVE;
  stateful?: false;
}

export type MemberLeaveArgument = GuildMember | PartialGuildMember;

export type MemberLeaveHandlerFunction<T extends DiscordEvent> =
  HandlerFunctionFor<T, DiscordEvent.MEMBER_LEAVE, [MemberLeaveArgument]>;
const baseKey = "";

export const addMemberLeaveHandler: AddEventHandlerFunction<MemberLeaveEventHandlerOptions> =
  (options, ioc, tree) => {
    tree[baseKey] ??= [];
    const handlers = tree[baseKey] as HIOC<DiscordEvent.MEMBER_LEAVE>[];
    handlers.push({ ioc, options });
  };

export const extractMemberLeaveInfo: ExtractInfoForEventFunction<DiscordEvent.MEMBER_LEAVE> =
  (member: MemberLeaveArgument) => {
    return { handlerKeys: [baseKey], member, isDirectMessage: false };
  };
