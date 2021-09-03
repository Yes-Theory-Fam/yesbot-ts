import {
  AddEventHandlerFunction,
  DiscordEvent,
  ExtractInfoForEventFunction,
  HandlerFunctionFor,
} from "../types/base";
import { GuildMember, PartialGuildMember } from "discord.js";
import { addToTree } from "../helper";

export interface MemberLeaveEventHandlerOptions {
  event: DiscordEvent.MEMBER_LEAVE;
  stateful?: false;
}

export type MemberLeaveArgument = GuildMember | PartialGuildMember;

export type MemberLeaveHandlerFunction<T extends DiscordEvent> =
  HandlerFunctionFor<T, DiscordEvent.MEMBER_LEAVE, [MemberLeaveArgument]>;
const baseKey = "";

export const addMemberLeaveHandler: AddEventHandlerFunction<MemberLeaveEventHandlerOptions> =
  (options, ioc, tree) => addToTree([""], { options, ioc }, tree);

export const extractMemberLeaveInfo: ExtractInfoForEventFunction<DiscordEvent.MEMBER_LEAVE> =
  (member: MemberLeaveArgument) => {
    return { handlerKeys: [baseKey], member, isDirectMessage: false };
  };
