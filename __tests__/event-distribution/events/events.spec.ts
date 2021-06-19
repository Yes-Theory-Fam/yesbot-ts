import { addEventHandler } from "../../../src/event-distribution/events/events";
import {
  addMessageHandler,
  MessageEventHandlerOptions,
} from "../../../src/event-distribution/events/message";
import { CommandHandler, DiscordEvent } from "../../../src/event-distribution";
import {
  addReactionHandler,
  ReactionEventHandlerOptions,
} from "../../../src/event-distribution/events/reactions";
import { mocked } from "ts-jest/utils";

jest.mock("../../../src/event-distribution/events/message");
jest.mock("../../../src/event-distribution/events/reactions");

describe("EventDistribution events", () => {
  it("should call addMessageHandler", () => {
    const mockedAddMessageHandler = mocked(addMessageHandler, true);
    addEventHandler(
      {
        description: "",
        event: DiscordEvent.MESSAGE,
        trigger: "!test",
      },
      {} as CommandHandler<
        (MessageEventHandlerOptions | ReactionEventHandlerOptions)["event"]
      >,
      {}
    );
    expect(mockedAddMessageHandler).toHaveBeenCalled();
  });

  it("should call addReactionHandler", () => {
    const mockedAddReactionHandler = mocked(addReactionHandler, true);
    addEventHandler(
      {
        description: "",
        event: DiscordEvent.REACTION_REMOVE,
        emoji: "♥️",
      },
      {} as CommandHandler<
        (MessageEventHandlerOptions | ReactionEventHandlerOptions)["event"]
      >,
      {}
    );
    expect(mockedAddReactionHandler).toHaveBeenCalled();
  });
});
