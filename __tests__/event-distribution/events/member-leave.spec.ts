import MockDiscord from "../../mocks";
import {
  InstanceOrConstructor,
  StringIndexedHIOCTree,
} from "../../../src/event-distribution/types/hioc";
import {
  CommandHandler,
  DiscordEvent,
} from "../../../src/event-distribution/index.js";
import {
  addMemberLeaveHandler,
  extractMemberLeaveInfo,
  MemberLeaveEventHandlerOptions,
} from "../../../src/event-distribution/events/member-leave";

describe("Member Leave", () => {
  let mockDiscord: MockDiscord;
  beforeEach(() => {
    mockDiscord = new MockDiscord();
  });

  it("should extract member from leaving member", () => {
    const member = mockDiscord.getGuildMember();
    const result = extractMemberLeaveInfo(member);
    expect(result).toMatchSnapshot();
  });

  it("should add data to the tree", () => {
    const tree: StringIndexedHIOCTree<DiscordEvent.MEMBER_LEAVE> = {};
    const options: MemberLeaveEventHandlerOptions = {
      event: DiscordEvent.MEMBER_LEAVE,
    };
    const ioc = {} as InstanceOrConstructor<
      CommandHandler<DiscordEvent.MEMBER_LEAVE>
    >;

    addMemberLeaveHandler(options, ioc, tree);
    expect(tree).toMatchSnapshot();
  });
});
