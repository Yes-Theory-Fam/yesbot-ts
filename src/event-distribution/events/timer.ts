import {
  AddEventHandlerFunction,
  BaseOptions,
  DiscordEvent,
  ExtractInfoForEventFunction,
  HandlerFunctionFor,
} from "..";
import { createYesBotLogger } from "../../log";
import { Timer } from "@yes-theory-fam/database/client";
import { addToTree } from "../helper";

export interface TimerEventHandlerOptions extends BaseOptions {
  event: DiscordEvent.TIMER;
  handlerIdentifier: string;
}

export type TimerHandlerFunction<T extends DiscordEvent> = HandlerFunctionFor<
  T,
  DiscordEvent.TIMER,
  [Timer]
>;

export const addTimerHandler: AddEventHandlerFunction<
  TimerEventHandlerOptions
> = (options, ioc, tree) => {
  const logger = createYesBotLogger("event-distribution", "timer");

  const key = options.handlerIdentifier;
  if (tree[key]) {
    logger.warn(
      "Added multiple timer handlers with identifier: " +
        key +
        ". This may not be intended."
    );
  }

  addToTree([key], { ioc, options }, tree);
};

export const extractTimerInfo: ExtractInfoForEventFunction<
  DiscordEvent.TIMER
> = (timer: Timer) => ({
  handlerKeys: [timer.handlerIdentifier],
  isDirectMessage: false,
});
