import {
  addMessageHandler,
  extractMessageInfo,
  MessageEventHandlerOptions,
} from "../../../src/event-distribution/events/message";
import MockDiscord from "../../mocks";
import {
  InstanceOrConstructor,
  StringIndexedHIOCTree,
} from "../../../src/event-distribution/types/hioc";
import { CommandHandler, DiscordEvent } from "../../../src/event-distribution";

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
    message.channel.type = "DM";
    const result = extractMessageInfo(message);
    expect(result).toMatchSnapshot();
  });

  it("should add data to the tree", () => {
    const tree: StringIndexedHIOCTree<DiscordEvent.MESSAGE> = { channel: {} };
    const options: MessageEventHandlerOptions = {
      description: "test",
      event: DiscordEvent.MESSAGE,
      trigger: "!test",
      channelNames: ["bot-output"],
    };
    const ioc = {} as InstanceOrConstructor<
      CommandHandler<DiscordEvent.MESSAGE>
    >;

    addMessageHandler(options, ioc, tree);
    expect(tree).toMatchSnapshot();

    const secondOptions = { ...options, allowedRoles: ["Support"] };
    addMessageHandler(secondOptions, ioc, tree);
    expect(tree).toMatchSnapshot();

    const thirdOptions = {
      ...options,
      trigger: "!otherTrigger",
      allowedRoles: ["Developer"],
      channelNames: ["bot-development", "bot-test-channel"],
    };
    addMessageHandler(thirdOptions, ioc, tree);
    expect(tree).toMatchSnapshot();
  });
});
