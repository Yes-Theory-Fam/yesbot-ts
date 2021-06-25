import MockDiscord from "../../mocks";
import { extractMessageInfo } from "../../../src/event-distribution/events/message";
import { extractReactionInfo } from "../../../src/event-distribution/events/reactions";

describe("Reactions", () => {
  let mockDiscord: MockDiscord;
  beforeEach(() => {
    mockDiscord = new MockDiscord();
  });

  it("should extract reaction from public channel", () => {
    const messageReaction = mockDiscord.getMessageReaction();
    const user = mockDiscord.getUser();
    const result = extractReactionInfo(messageReaction, user);
    expect(result).toMatchSnapshot();
  });

  it("should extract reaction from direct message", () => {
    const messageReaction = mockDiscord.getMessageReaction();
    const user = mockDiscord.getUser();
    messageReaction.message.channel.type = "dm";
    const result = extractReactionInfo(messageReaction, user);
    expect(result).toMatchSnapshot();
  });
});
