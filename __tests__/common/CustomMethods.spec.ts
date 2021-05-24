import { sendLove, randomReply, abuseMe } from "../../src/common/CustomMethods";

import MockDiscord from "../mocks";
import Discord, { Collection, Message, Snowflake, User } from "discord.js";

describe("custom method", () => {
  const mockDiscord = new MockDiscord();

  const mentionUsers = new Collection<Snowflake, User>();
  mentionUsers.set(
    Discord.SnowflakeUtil.generate(new Date()).toString(),
    mockDiscord.getUser()
  );

  const message: Message = {
    author: {
      id: 111111111111111100,
    },
    mentions: {
      users: mentionUsers,
    },
    channel: { send: jest.fn(() => Promise.resolve(mockDiscord.getMessage())) },
    reply: jest.fn(() => Promise.resolve(mockDiscord.getMessage())),
    react: jest.fn(() => Promise.resolve(mockDiscord.getMessageReaction())),
    cleanContent: "cleanContent",
  } as unknown as Message;

  const mockMath = Object.create(global.Math);
  mockMath.random = () => 0.5;
  global.Math = mockMath;

  it("sendLove should reply with `Okay.` and react", async () => {
    await sendLove(message);
    expect(message.reply).toHaveBeenCalledWith("Okay.");
    expect(message.react).toHaveBeenCalledWith("😍");
  });

  it("randomReply should reply with an random message", async () => {
    await randomReply(message);
    expect(message.reply).toHaveBeenCalledWith("absolutely not.");
  });

  it("abuseMe should reply to yourself", async () => {
    await abuseMe(message);
    expect(message.channel.send).toHaveBeenCalledWith(
      "<@222222222222222200> *``* translated to English means *Is your a$$ jealous of the amount of sh!t that just came out of your mouth?*"
    );
  });

  it("abuseMe should reply to mention", async () => {
    const mentionUsers = new Collection<Snowflake, User>();
    mentionUsers.set(
      Discord.SnowflakeUtil.generate(new Date()).toString(),
      mockDiscord.getUser()
    );
    const msg: Message = {
      author: {
        id: 111111111111111100,
      },
      mentions: {
        users: mentionUsers,
      },
      channel: {
        send: jest.fn(() => Promise.resolve(mockDiscord.getMessage())),
      },
      cleanContent: "cleanContent",
      client: mockDiscord.getClient(),
    } as unknown as Message;

    abuseMe(msg)
      .then(() => {
        return expect(msg.channel.send).toHaveBeenCalledWith(
          "<@222222222222222200> *``* translated to English means *Is your a$$ jealous of the amount of sh!t that just came out of your mouth?*"
        );
      })
      .catch((error) => console.log(error));
  });
});
