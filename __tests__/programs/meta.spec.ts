import {Collection, Message, MessageContextMenuCommandInteraction} from "discord.js";
import {MetaCommand, metaCommandCoverage} from "../../src/programs/meta.js";
import {vi} from "vitest";

describe("MetaCommand", () => {
  let command: MessageContextMenuCommandInteraction;
  let message: Message;

  beforeEach(() => {
    message = {
      author: { id: "001", username: "user1" },
      reactions: {
        cache: new Collection(),
        some: vi.fn(),
      },
      reply: vi.fn(),
      react: vi.fn(),
    } as unknown as Message;

    command = {
      user: { id: "002", username: "user2" },
      targetMessage: message,
      reply: vi.fn(),
    } as unknown as MessageContextMenuCommandInteraction;
  });

  afterEach(() => {
        const metaCommandCoverageSum = metaCommandCoverage.reduce((sum, x) => sum + x);
        console.log("Branch coverage on resource after test run: " + ((metaCommandCoverageSum / (metaCommandCoverage.length) * 100).toPrecision(3) + "%"));
  });

  it("Throws SELF_META error if user tries to meta itself", async () => {
    command.user = message.author;
    const handler = new MetaCommand();
    await expect(handler.handle(command)).rejects.toThrow("SELF_META");
  });

  it("Throws ALREADY_METAED error if the message is already metaed", async () => {
    message.reactions.cache.set("someKey", { me: true });
    const handler = new MetaCommand();
    await expect(handler.handle(command)).rejects.toThrow("ALREADY_METAED");
  });

  it("Reacts with default 🦥 emoji if the specified emoji does not exist", async () => {
    const handler = new MetaCommand();
    await handler.handle(command);
    expect(message.react).toHaveBeenCalledWith("🦥");
  });

});
