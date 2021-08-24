import {
  AddEventHandlerFunction,
  DiscordEvent,
  ExtractInfoForEventFunction,
  HandlerFunctionFor,
} from "../types/base";
import { VoiceState } from "discord.js";
import { addToTree } from "../helper";

export enum VoiceStateChange {
  JOINED = "JOINED",
  LEFT = "LEFT",
  SWITCHED_CHANNEL = "SWITCHED_CHANNEL",
  MUTED = "MUTED",
  UNMUTED = "UNMUTED",
}

export interface VoiceStateUpdateEventHandlerOptions {
  event: DiscordEvent.VOICE_STATE_UPDATE;
  changes: [VoiceStateChange, ...VoiceStateChange[]];
  stateful?: false;
}

export type VoiceStateHandlerFunction<T extends DiscordEvent> =
  HandlerFunctionFor<
    T,
    DiscordEvent.VOICE_STATE_UPDATE,
    [VoiceState, VoiceState]
  >;

export const addVoiceStateUpdateHandler: AddEventHandlerFunction<VoiceStateUpdateEventHandlerOptions> =
  (options, ioc, tree) => {
    for (const baseKey of options.changes) {
      addToTree([baseKey], { options, ioc }, tree);
    }
  };

export const extractVoiceStateUpdateInfo: ExtractInfoForEventFunction<DiscordEvent.VOICE_STATE_UPDATE> =
  (oldState: VoiceState, newState: VoiceState) => {
    const changes: VoiceStateChange[] = [];

    if (!oldState.mute && newState.mute) changes.push(VoiceStateChange.MUTED);
    if (oldState.mute && !newState.mute) changes.push(VoiceStateChange.UNMUTED);

    if (!oldState.channel && newState.channel)
      changes.push(VoiceStateChange.JOINED);
    if (oldState.channel && !newState.channel)
      changes.push(VoiceStateChange.LEFT);

    if (
      oldState.channel &&
      newState.channel &&
      oldState.channelId !== newState.channelId
    )
      changes.push(VoiceStateChange.SWITCHED_CHANNEL);

    return changes.map((c) => ({ handlerKeys: [c], isDirectMessage: false }));
  };
