import {
  addGuildMemberUpdateHandler,
  extractGuildMemberUpdateInfo,
  GuildMemberUpdateEventHandlerOptions,
} from "../../../src/event-distribution/events/guild-member-update";
import MockDiscord from "../../mocks";
import {
  InstanceOrConstructor,
  StringIndexedHIOCTree,
} from "../../../src/event-distribution/types/hioc";
import {
  CommandHandler,
  DiscordEvent,
} from "../../../src/event-distribution/index.js";

describe("GuildMemberUpdates", () => {
  let mockDiscord: MockDiscord;
  beforeEach(() => {
    mockDiscord = new MockDiscord();
  });

  // it("should extract keys despite no role differences", () => {
  //   const oldMember = mockDiscord.getGuildMember();
  //   const newMember = mockDiscord.getGuildMember();
  //   newMember.nickname = "Test";
  //   const result = extractGuildMemberUpdateInfo(oldMember, newMember);
  //   expect(result).toMatchSnapshot();
  // });
  //
  // it("should extract keys with a single role difference", () => {
  //   const oldMember = mockDiscord.getGuildMember();
  //   const newMember = mockDiscord.getGuildMember();
  //   const role = mockDiscord.getRole();
  //   newMember.roles.cache.set(role.id, role);
  //   const result = extractGuildMemberUpdateInfo(oldMember, newMember);
  //   expect(result).toMatchSnapshot();
  // });
  //
  // it("should extract keys with multiple role differences", () => {
  //   const oldMember = mockDiscord.getGuildMember();
  //   const newMember = mockDiscord.getGuildMember();
  //   const role = mockDiscord.getRole();
  //   const role2 = mockDiscord.getRole();
  //   newMember.roles.cache.set(role.id, role);
  //   newMember.roles.cache.set(role2.id, role2);
  //   const result = extractGuildMemberUpdateInfo(oldMember, newMember);
  //   expect(result).toMatchSnapshot();
  // });

  it("should add data to the tree", () => {
    const tree: StringIndexedHIOCTree<DiscordEvent.GUILD_MEMBER_UPDATE> = {};
    const options: GuildMemberUpdateEventHandlerOptions = {
      event: DiscordEvent.GUILD_MEMBER_UPDATE,
      roleNamesAdded: ["Test"],
      roleNamesRemoved: ["Example"],
    };
    const ioc = {} as InstanceOrConstructor<
      CommandHandler<DiscordEvent.GUILD_MEMBER_UPDATE>
    >;

    addGuildMemberUpdateHandler(options, ioc, tree);
    expect(tree).toMatchSnapshot();

    const secondOptions: GuildMemberUpdateEventHandlerOptions = {
      event: DiscordEvent.GUILD_MEMBER_UPDATE,
    };
    addGuildMemberUpdateHandler(secondOptions, ioc, tree);
    expect(tree).toMatchSnapshot();

    const thirdOptions: GuildMemberUpdateEventHandlerOptions = {
      event: DiscordEvent.GUILD_MEMBER_UPDATE,
      roleNamesAdded: ["Test"],
    };
    addGuildMemberUpdateHandler(thirdOptions, ioc, tree);
    expect(tree).toMatchSnapshot();
  });
});
