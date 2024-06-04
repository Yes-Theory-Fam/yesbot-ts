import MockDiscord from "../../mocks/index.js";
import {
  addVoiceStateUpdateHandler,
  extractVoiceStateUpdateInfo,
  VoiceStateChange,
  VoiceStateUpdateEventHandlerOptions,
} from "../../../src/event-distribution/events/voice-state-update.js";
import { VoiceChannel } from "discord.js";
import {
  InstanceOrConstructor,
  StringIndexedHIOCTree,
} from "../../../src/event-distribution/types/hioc.js";
import {
  CommandHandler,
  DiscordEvent,
} from "../../../src/event-distribution/index.js";

describe("Voice State Update", () => {
  let mockDiscord: MockDiscord;

  beforeEach(() => {
    mockDiscord = new MockDiscord();
  });

  it("should extract information from mute events", () => {
    const secondMock = new MockDiscord();
    const oldState = mockDiscord.getVoiceState();
    const newState = { ...secondMock.getVoiceState(), mute: true };

    const result = extractVoiceStateUpdateInfo(oldState, newState);
    expect(result).toMatchSnapshot();
  });

  it("should extract information from multiple events", () => {
    const secondMock = new MockDiscord();
    const oldState = mockDiscord.getVoiceState();
    const newState = {
      ...secondMock.getVoiceState(),
      mute: true,
      channel: secondMock.getChannel() as VoiceChannel,
    };

    const result = extractVoiceStateUpdateInfo(oldState, newState);
    expect(result).toMatchSnapshot();
  });

  it("should add data to the tree", () => {
    const tree: StringIndexedHIOCTree<DiscordEvent.VOICE_STATE_UPDATE> = {};
    const options: VoiceStateUpdateEventHandlerOptions = {
      event: DiscordEvent.VOICE_STATE_UPDATE,
      changes: [VoiceStateChange.MUTED],
    };

    const ioc = {} as InstanceOrConstructor<
      CommandHandler<DiscordEvent.VOICE_STATE_UPDATE>
    >;
    addVoiceStateUpdateHandler(options, ioc, tree);
    expect(tree).toMatchSnapshot();

    const secondOptions: VoiceStateUpdateEventHandlerOptions = {
      event: DiscordEvent.VOICE_STATE_UPDATE,
      changes: [VoiceStateChange.MUTED, VoiceStateChange.JOINED],
    };

    addVoiceStateUpdateHandler(secondOptions, ioc, tree);
    expect(tree).toMatchSnapshot();
  });
});
