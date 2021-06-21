import {
  addEventHandler,
  extractEventInfo,
} from "../../../src/event-distribution/events/events";
import {
  addMessageHandler,
  extractMessageInfo,
  MessageEventHandlerOptions,
} from "../../../src/event-distribution/events/message";
import { CommandHandler, DiscordEvent } from "../../../src/event-distribution";
import {
  addReactionHandler,
  extractReactionInfo,
  ReactionEventHandlerOptions,
} from "../../../src/event-distribution/events/reactions";
import { mocked } from "ts-jest/utils";
import MockDiscord from "../../mocks";

jest.mock("../../../src/event-distribution/events/message");
jest.mock("../../../src/event-distribution/events/reactions");

describe("EventDistribution events on DiscordEvent.MESSAGE", () => {
  const mockedAddMessageHandler = mocked(addMessageHandler, true);
  const mockedAddReactionHandler = mocked(addReactionHandler, true);
  const mockedDiscord = new MockDiscord();

  it("should call addMessageHandler", () => {
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
    expect(mockedAddReactionHandler).not.toHaveBeenCalled();
  });

  it("should call addReactionHandler on DiscordEvent.REACTION_REMOVE", () => {
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

    expect(mockedAddMessageHandler).not.toHaveBeenCalled();
    expect(mockedAddReactionHandler).toHaveBeenCalled();
  });

  it("should call addReactionHandler on DiscordEvent.REACTION_ADD", () => {
    addEventHandler(
      {
        description: "",
        event: DiscordEvent.REACTION_ADD,
        emoji: "♥️",
      },
      {} as CommandHandler<
        (MessageEventHandlerOptions | ReactionEventHandlerOptions)["event"]
      >,
      {}
    );
    expect(mockedAddMessageHandler).not.toHaveBeenCalled();
    expect(mockedAddReactionHandler).toHaveBeenCalled();
  });

  it("should call extractMessageInfo from message", () => {
    const mockedExtractMessageInfoMock = mocked(extractMessageInfo, true);
    const message = mockedDiscord.getMessage();
    extractEventInfo(DiscordEvent.MESSAGE, message);
    expect(mockedExtractMessageInfoMock).toHaveBeenCalledWith(message);
  });

  it("should call extractReactionInfo from reaction add", () => {
    const mockedExtractReactionInfo = mocked(extractReactionInfo, true);
    const messageReaction = mockedDiscord.getMessageReaction();
    const user = mockedDiscord.getUser();
    extractEventInfo(DiscordEvent.REACTION_ADD, messageReaction, user);
    expect(mockedExtractReactionInfo).toHaveBeenCalledWith(
      messageReaction,
      user
    );
  });

  it("should call extractReactionInfo from reaction remove", () => {
    const mockedExtractReactionInfo = mocked(extractReactionInfo, true);
    const messageReaction = mockedDiscord.getMessageReaction();
    const user = mockedDiscord.getUser();
    extractEventInfo(DiscordEvent.REACTION_REMOVE, messageReaction, user);
    expect(mockedExtractReactionInfo).toHaveBeenCalledWith(
      messageReaction,
      user
    );
  });

  it("should throw an error no event is provided", () => {
    const messageReaction = mockedDiscord.getMessageReaction();
    const user = mockedDiscord.getUser();
    const event = "test" as DiscordEvent;
    expect(() =>
      extractEventInfo(event, messageReaction, user)
    ).toThrowErrorMatchingSnapshot();
  });
});
