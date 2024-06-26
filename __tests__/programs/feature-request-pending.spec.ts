import {ThreadChannel, ChannelType} from "discord.js";
import {FeatureRequestPending, featureRequestPendingCoverage} from "../../src/programs/feature-request-pending.js";
import {vi} from "vitest";

describe("FeatureRequestPending", () => {
  let mockChannel: ThreadChannel;
  let handler: FeatureRequestPending;

  beforeEach(() => {
    mockChannel = {
      parent: {
        type: ChannelType.GuildForum,
        availableTags: [
          { id: "tag1", name: "pending" },
        ],
      },
      appliedTags: [],
      setAppliedTags: vi.fn().mockResolvedValue(undefined),
    } as unknown as ThreadChannel;

    handler = new FeatureRequestPending();
  });

  afterEach(() => {
      const featureRequestPendingCoverageSum = featureRequestPendingCoverage.reduce((sum, x) => sum + x);
      console.log("Branch coverage on resource after test run: " + ((featureRequestPendingCoverageSum / (featureRequestPendingCoverage.length) * 100).toPrecision(3) + "%"));
  });

  it("Function returns early if parent object is undefined", async () => {
    mockChannel.parent = undefined;
    await handler.handle(mockChannel, true);
    expect(mockChannel.setAppliedTags).not.toHaveBeenCalled();
  });

  it("Function returns early if parent is not of type GuildForum", async () => {
    mockChannel.parent.type = ChannelType.Text;
    await handler.handle(mockChannel, true);
    expect(mockChannel.setAppliedTags).not.toHaveBeenCalled();
  });

  it("should return early if 'pending' tag is not found", async () => {
    mockChannel.parent.availableTags = [
      { id: "tag1", name: "not pending" },
    ];

    await handler.handle(mockChannel, true);
    expect(mockChannel.setAppliedTags).not.toHaveBeenCalled();
  });

});
