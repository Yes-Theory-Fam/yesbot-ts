import { extractMessageInfo } from "../../../src/event-distribution/events/message";
import MockDiscord from "../../mocks";

describe("Messages", () => {
  let mockDiscord: MockDiscord;
  beforeEach(() => {
    mockDiscord = new MockDiscord();
  });

  it("should extract messages from public channel", () => {
    const message = mockDiscord.getMessage();
    const result = extractMessageInfo(message);
    expect(result).toMatchSnapshot();
  });

  it("should extract messages from direct message", () => {
    const message = mockDiscord.getMessage();
    message.channel.type = "dm";
    const result = extractMessageInfo(message);
    expect(result).toMatchSnapshot();
  });
});
