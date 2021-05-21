import {
  sendLove,
  randomReply,
  abuseMe,
} from "../../src/common/CustomMethods";

import MockDiscord from "../mocks";
import { Collection, Message, Snowflake, User } from "discord.js";

describe("test custom methods", () => {
  const mockDiscord = new MockDiscord();

  const mentionUsers = new Collection<Snowflake, User>();
  mentionUsers.set("Discord.SnowflakeUtil.generate(new Date()).toString()", mockDiscord.getUser());

  const message: Message = ({
    author: {
      id: 312297787901607937,
    },
    mentions: {
      users: mentionUsers,
    },
    channel: { send: jest.fn() },
    reply: jest.fn(),
    react: jest.fn(),
    cleanContent: "cleanContent",
  } as unknown) as Message;


  const mockMath = Object.create(global.Math);
  mockMath.random = () => 0.5;
  global.Math = mockMath;

  it("should reply with `Okay.` and react on sendLove", () => {

    sendLove(message);
    expect(message.reply).toHaveBeenCalledWith("Okay.");
    expect(message.react).toHaveBeenCalledWith("😍");
  });

  it("should reply with an random message on randomReply", () => {
    randomReply(message);
    expect(message.reply).toHaveBeenCalledWith("absolutely not.");
  });

  it("should reply with mention on abuseMe", async () => {
    abuseMe(message);
    expect(message.channel.send).toHaveBeenCalledWith("<@user-id> *``* translated to English means *Is your a$$ jealous of the amount of sh!t that just came out of your mouth?*");
  });

  it("should reply without mention on abuseMe", async () => {

    const mentionUsers = new Collection<Snowflake, User>();
    const msg: Message = ({
      author: {
        id: 312297787901607937,
      },
      mentions: {
        users: mentionUsers,
      },
      channel: { send: jest.fn() },
      reply: jest.fn(),
      react: jest.fn(),
      cleanContent: "cleanContent",
    } as unknown) as Message;

    abuseMe(msg);
    expect(msg.channel.send).toHaveBeenCalledWith("<@312297787901607940> *``* translated to English means *Is your a$$ jealous of the amount of sh!t that just came out of your mouth?*");
  });
});
