import {
  addEventHandler,
  extractEventInfo,
} from "../../../src/event-distribution/events/events.js";
import {
  addMessageHandler,
  extractMessageInfo,
} from "../../../src/event-distribution/events/message.js";
import {
  CommandHandler,
  DiscordEvent,
} from "../../../src/event-distribution/index.js";
import {
  addReactionHandler,
  extractReactionInfo,
} from "../../../src/event-distribution/events/reactions.js";
import MockDiscord from "../../mocks/index.js";
import {
  addReadyHandler,
  extractReadyInfo,
} from "../../../src/event-distribution/events/ready.js";
import {
  addGuildMemberUpdateHandler,
  extractGuildMemberUpdateInfo,
} from "../../../src/event-distribution/events/guild-member-update.js";
import {
  addMemberLeaveHandler,
  extractMemberLeaveInfo,
} from "../../../src/event-distribution/events/member-leave.js";
import {
  addVoiceStateUpdateHandler,
  extractVoiceStateUpdateInfo,
  VoiceStateChange,
} from "../../../src/event-distribution/events/voice-state-update.js";
import {
   addThreadCreateHandler,
   extractThreadCreateInfo 
} from "../../../src/event-distribution/events/thread-create.js";

import { beforeEach, vi } from "vitest";

vi.mock("../../../src/event-distribution/events/guild-member-update");
vi.mock("../../../src/event-distribution/events/member-leave");
vi.mock("../../../src/event-distribution/events/message");
vi.mock("../../../src/event-distribution/events/reactions");
vi.mock("../../../src/event-distribution/events/ready");
vi.mock("../../../src/event-distribution/events/voice-state-update");
vi.mock("../../../src/event-distribution/events/thread-create.js");

describe("EventDistribution events", () => {
  const mockedDiscord = new MockDiscord();

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should call addMemberLeaveHandler on DiscordEvent.MEMBER_LEAVE", () => {
    addEventHandler(
      {
        event: DiscordEvent.MEMBER_LEAVE,
      },
      {} as CommandHandler<DiscordEvent>,
      {}
    );

    expect(addMemberLeaveHandler).toHaveBeenCalled();
  });

  it("should call addMessageHandler on DiscordEvent.MESSAGE", () => {
    addEventHandler(
      {
        description: "",
        event: DiscordEvent.MESSAGE,
        trigger: "!test",
      },
      {} as CommandHandler<DiscordEvent>,
      {}
    );

    expect(addMessageHandler).toHaveBeenCalled();
    expect(addReactionHandler).not.toHaveBeenCalled();
  });

  it("should call addReactionHandler on DiscordEvent.REACTION_REMOVE", () => {
    addEventHandler(
      {
        event: DiscordEvent.REACTION_REMOVE,
        emoji: "♥️",
      },
      {} as CommandHandler<DiscordEvent>,
      {}
    );

    expect(addMessageHandler).not.toHaveBeenCalled();
    expect(addReactionHandler).toHaveBeenCalled();
  });

  it("should call addReactionHandler on DiscordEvent.REACTION_ADD", () => {
    addEventHandler(
      {
        event: DiscordEvent.REACTION_ADD,
        emoji: "♥️",
      },
      {} as CommandHandler<DiscordEvent>,
      {}
    );
    expect(addMessageHandler).not.toHaveBeenCalled();
    expect(addReactionHandler).toHaveBeenCalled();
  });

  it("should call addGuildMemberUpdateHandler on DiscordEvent.GUILD_MEMBER_UPDATE", () => {
    addEventHandler(
      {
        event: DiscordEvent.GUILD_MEMBER_UPDATE,
      },
      {} as CommandHandler<DiscordEvent>,
      {}
    );

    expect(addGuildMemberUpdateHandler).toHaveBeenCalled();
  });

  it("should call addReadyHandler on DiscordEvent.READY", () => {
    addEventHandler(
      { event: DiscordEvent.READY },
      {} as CommandHandler<DiscordEvent>,
      {}
    );

    expect(addReadyHandler).toHaveBeenCalled();
  });

  it("should call addVoiceStateUpdateHandler on DiscordEvent.READY", () => {
    addEventHandler(
      {
        event: DiscordEvent.VOICE_STATE_UPDATE,
        changes: [VoiceStateChange.JOINED],
      },
      {} as CommandHandler<DiscordEvent>,
      {}
    );

    expect(addVoiceStateUpdateHandler).toHaveBeenCalled();
  });

  it("should call extractMessageInfo from message", () => {
    const message = mockedDiscord.getMessage();
    extractEventInfo(DiscordEvent.MESSAGE, message);
    expect(extractMessageInfo).toHaveBeenCalledWith(message);
  });

  it("should call extractReactionInfo from reaction add", () => {
    const messageReaction = mockedDiscord.getMessageReaction();
    const user = mockedDiscord.getUser();
    extractEventInfo(DiscordEvent.REACTION_ADD, messageReaction, user);
    expect(extractReactionInfo).toHaveBeenCalledWith(messageReaction, user);
  });

  it("should call extractReactionInfo from reaction remove", () => {
    const messageReaction = mockedDiscord.getMessageReaction();
    const user = mockedDiscord.getUser();
    extractEventInfo(DiscordEvent.REACTION_REMOVE, messageReaction, user);
    expect(extractReactionInfo).toHaveBeenCalledWith(messageReaction, user);
  });

  it("should call extractGuildMemberUpdateInfo from guild member update", () => {
    const oldMember = mockedDiscord.getGuildMember();
    const newMember = mockedDiscord.getGuildMember();
    extractEventInfo(DiscordEvent.GUILD_MEMBER_UPDATE, oldMember, newMember);
    expect(extractGuildMemberUpdateInfo).toHaveBeenCalledWith(
      oldMember,
      newMember
    );
  });

  it("should call extractReadyInfo from ready", () => {
    const client = mockedDiscord.getClient();
    extractEventInfo(DiscordEvent.READY, client);
    expect(extractReadyInfo).toHaveBeenCalledWith(client);
  });

  it("should call extractMemberLeaveInfo from member leave", () => {
    const member = mockedDiscord.getGuildMember();
    extractEventInfo(DiscordEvent.MEMBER_LEAVE, member);
    expect(extractMemberLeaveInfo).toHaveBeenCalledWith(member);
  });

  it("should call extractVoiceStateUpdateInfo from voice state update", () => {
    const oldState = mockedDiscord.getVoiceState();
    const newState = mockedDiscord.getVoiceState();
    extractEventInfo(DiscordEvent.VOICE_STATE_UPDATE, oldState, newState);
    expect(extractVoiceStateUpdateInfo).toHaveBeenCalledWith(
      oldState,
      newState
    );
  });

  it("should call addThreadCreateHandler on DiscordEvent.THREAD_CREATE", () => {
    addEventHandler(
      {
        event: DiscordEvent.THREAD_CREATE
      },
      {} as CommandHandler<DiscordEvent>,
      {}
    );

    expect(addThreadCreateHandler).toHaveBeenCalled();
  });

  it("should call extractThreadCreateInfo on from thread create", () => {
    const threadChannel = mockedDiscord.getThreadChannel();
    extractEventInfo(DiscordEvent.THREAD_CREATE, threadChannel, false);
    expect(extractThreadCreateInfo).toHaveBeenCalledWith(threadChannel, false);
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
