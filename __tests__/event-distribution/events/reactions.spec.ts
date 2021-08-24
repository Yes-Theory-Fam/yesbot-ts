import MockDiscord from "../../mocks";
import {
  addReactionHandler,
  extractReactionInfo,
  ReactionEventHandlerOptions,
} from "../../../src/event-distribution/events/reactions";
import {
  InstanceOrConstructor,
  StringIndexedHIOCTree,
} from "../../../src/event-distribution/types/hioc";
import { CommandHandler, DiscordEvent } from "../../../src/event-distribution";

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
    messageReaction.message.channel.type = "DM";
    const result = extractReactionInfo(messageReaction, user);
    expect(result).toMatchSnapshot();
  });

  it("should add data to the tree", () => {
    const tree: StringIndexedHIOCTree<
      DiscordEvent.REACTION_ADD | DiscordEvent.REACTION_REMOVE
    > = { channel: {} };
    const options: ReactionEventHandlerOptions = {
      emoji: "♥️",
      description: "test",
      event: DiscordEvent.REACTION_ADD,
      channelNames: ["bot-output"],
    };
    const ioc = {} as InstanceOrConstructor<
      CommandHandler<DiscordEvent.REACTION_ADD | DiscordEvent.REACTION_REMOVE>
    >;

    addReactionHandler(options, ioc, tree);
    expect(tree).toMatchSnapshot();

    const secondOptions: ReactionEventHandlerOptions = {
      ...options,
      event: DiscordEvent.REACTION_REMOVE,
      allowedRoles: ["Support"],
    };
    addReactionHandler(secondOptions, ioc, tree);
    expect(tree).toMatchSnapshot();

    const thirdOptions: ReactionEventHandlerOptions = {
      ...options,
      emoji: "😘️",
      allowedRoles: ["Developer"],
      channelNames: ["bot-development", "bot-test-channel"],
    };
    addReactionHandler(thirdOptions, ioc, tree);
    expect(tree).toMatchSnapshot();
  });
});
