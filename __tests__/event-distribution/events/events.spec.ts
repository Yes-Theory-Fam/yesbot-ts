import {
  addEventHandler,
  extractEventInfo,
} from "../../../src/event-distribution/events/events";
import {
  addMessageHandler,
  extractMessageInfo,
} from "../../../src/event-distribution/events/message";
import { CommandHandler, DiscordEvent } from "../../../src/event-distribution";
import {
  addReactionHandler,
  extractReactionInfo,
} from "../../../src/event-distribution/events/reactions";
import { mocked } from "jest-mock";
import MockDiscord from "../../mocks";
import {
  addReadyHandler,
  extractReadyInfo,
} from "../../../src/event-distribution/events/ready";
import {
  addGuildMemberUpdateHandler,
  extractGuildMemberUpdateInfo,
} from "../../../src/event-distribution/events/guild-member-update";
import {
  addMemberLeaveHandler,
  extractMemberLeaveInfo,
} from "../../../src/event-distribution/events/member-leave";
import {
  addVoiceStateUpdateHandler,
  extractVoiceStateUpdateInfo,
  VoiceStateChange,
} from "../../../src/event-distribution/events/voice-state-update";

jest.mock("../../../src/event-distribution/events/guild-member-update");
jest.mock("../../../src/event-distribution/events/member-leave");
jest.mock("../../../src/event-distribution/events/message");
jest.mock("../../../src/event-distribution/events/reactions");
jest.mock("../../../src/event-distribution/events/ready");
jest.mock("../../../src/event-distribution/events/voice-state-update");

describe("EventDistribution events", () => {
  const mockedAddMessageHandler = mocked(addMessageHandler, true);
  const mockedAddReactionHandler = mocked(addReactionHandler, true);
  const mockedDiscord = new MockDiscord();

  it("should call addMemberLeaveHandler on DiscordEvent.MEMBER_LEAVE", () => {
    addEventHandler(
      {
        event: DiscordEvent.MEMBER_LEAVE,
      },
      {} as CommandHandler<DiscordEvent>,
      {}
    );

    const mockedAddMemberLeaveHandler = mocked(addMemberLeaveHandler, true);
    expect(mockedAddMemberLeaveHandler).toHaveBeenCalled();
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

    expect(mockedAddMessageHandler).toHaveBeenCalled();
    expect(mockedAddReactionHandler).not.toHaveBeenCalled();
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

    expect(mockedAddMessageHandler).not.toHaveBeenCalled();
    expect(mockedAddReactionHandler).toHaveBeenCalled();
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
    expect(mockedAddMessageHandler).not.toHaveBeenCalled();
    expect(mockedAddReactionHandler).toHaveBeenCalled();
  });

  it("should call addGuildMemberUpdateHandler on DiscordEvent.GUILD_MEMBER_UPDATE", () => {
    addEventHandler(
      {
        event: DiscordEvent.GUILD_MEMBER_UPDATE,
      },
      {} as CommandHandler<DiscordEvent>,
      {}
    );

    const mockedAddGuildMemberUpdateHandler = mocked(
      addGuildMemberUpdateHandler,
      true
    );
    expect(mockedAddGuildMemberUpdateHandler).toHaveBeenCalled();
  });

  it("should call addReadyHandler on DiscordEvent.READY", () => {
    addEventHandler(
      { event: DiscordEvent.READY },
      {} as CommandHandler<DiscordEvent>,
      {}
    );

    const mockedAddReadyHandler = mocked(addReadyHandler, true);
    expect(mockedAddReadyHandler).toHaveBeenCalled();
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

    const mockedAddVoiceStateUpdateHandler = mocked(
      addVoiceStateUpdateHandler,
      true
    );
    expect(mockedAddVoiceStateUpdateHandler).toHaveBeenCalled();
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

  it("should call extractGuildMemberUpdateInfo from guild member update", () => {
    const mockedExtractGuildMemberUpdateInfo = mocked(
      extractGuildMemberUpdateInfo,
      true
    );
    const oldMember = mockedDiscord.getGuildMember();
    const newMember = mockedDiscord.getGuildMember();
    extractEventInfo(DiscordEvent.GUILD_MEMBER_UPDATE, oldMember, newMember);
    expect(mockedExtractGuildMemberUpdateInfo).toHaveBeenCalledWith(
      oldMember,
      newMember
    );
  });

  it("should call extractReadyInfo from ready", () => {
    const mockedExtractReadyInfo = mocked(extractReadyInfo, true);
    const client = mockedDiscord.getClient();
    extractEventInfo(DiscordEvent.READY, client);
    expect(mockedExtractReadyInfo).toHaveBeenCalledWith(client);
  });

  it("should call extractMemberLeaveInfo from member leave", () => {
    const mockedExtractMemberLeaveInfo = mocked(extractMemberLeaveInfo, true);
    const member = mockedDiscord.getGuildMember();
    extractEventInfo(DiscordEvent.MEMBER_LEAVE, member);
    expect(mockedExtractMemberLeaveInfo).toHaveBeenCalledWith(member);
  });

  it("should call extractVoiceStateUpdateInfo from voice state update", () => {
    const mockedVoiceStateUpdateInfo = mocked(
      extractVoiceStateUpdateInfo,
      true
    );
    const oldState = mockedDiscord.getVoiceState();
    const newState = mockedDiscord.getVoiceState();
    extractEventInfo(DiscordEvent.VOICE_STATE_UPDATE, oldState, newState);
    expect(mockedVoiceStateUpdateInfo).toHaveBeenCalledWith(oldState, newState);
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
