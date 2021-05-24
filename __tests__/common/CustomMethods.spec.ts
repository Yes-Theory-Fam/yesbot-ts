import {
  abuseMe,
  proposeNameChange,
  randomReply,
  sendLove,
} from "../../src/common/CustomMethods";
import MockDiscord from "../mocks";
import Discord, {
  Collection,
  Message,
  MessageReaction,
  Snowflake,
  User,
} from "discord.js";
import moderator from "../../src/common/moderator";
import { Bot } from "../../src/bot";

jest.mock("../../src/bot");

const mockDiscord = new MockDiscord();

describe("custom method", () => {
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

  const mockStaticF = jest.fn().mockReturnValue(new Bot());
  Bot.getInstance = mockStaticF;
  const bot = Bot.getInstance();
  bot.getClient = jest.fn(() => mockDiscord.getClient());

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

  it("proposeNameChange should allow to change name", async () => {
    const newName = "NewName";

    const msg: Message = {
      author: mockDiscord.getUser(),
      mentions: {
        users: mentionUsers,
      },
      channel: {
        send: jest.fn(() => Promise.resolve(mockDiscord.getMessage())),
      },
      react: jest.fn(() => Promise.resolve(mockDiscord.getMessageReaction())),
      reply: jest.fn(() => Promise.resolve(mockDiscord.getMessage())),
      cleanContent: "cleanContent",
      client: mockDiscord.getClient(),
    } as unknown as Message;

    const moderatorMessage: Message = {
      author: {
        id: 111111111111111100,
      },
      mentions: {
        users: mentionUsers,
      },
      channel: {
        send: jest.fn(() => Promise.resolve(mockDiscord.getMessage())),
      },
      reply: jest.fn(() => Promise.resolve(mockDiscord.getMessage())),
      react: jest.fn(() => Promise.resolve(mockDiscord.getMessageReaction())),
      delete: jest.fn(() => Promise.resolve(moderatorMessage)),
      awaitReactions: jest.fn(() => Promise.resolve(reactionCollection)),
      cleanContent: "cleanContent",
      client: mockDiscord.getClient(),
    } as unknown as Message;

    const reactionCollection = new Collection<Snowflake, MessageReaction>();
    reactionCollection.set(
      Discord.SnowflakeUtil.generate(new Date()).toString(),
      new MessageReaction(
        mockDiscord.getClient(),
        {
          id: "messageReaction-id",
          author: 111111111111111122,
          count: 1,
          me: true,
          emoji: "✅",
        },
        moderatorMessage
      )
    );

    const getGuildMember = mockDiscord.getGuildMember();

    moderator.textLog = jest.fn(() => Promise.resolve(moderatorMessage));
    moderator.getMember = jest.fn(() => getGuildMember);

    await proposeNameChange(newName, msg);
    expect(msg.reply).toHaveBeenCalledWith(
      "Perfect! I've sent your name request to the mods, hopefully they answer soon! In the meantime, you're free to roam around the server and explore. Maybe post an introduction to get started? :grin:"
    );
    expect(moderator.textLog).toHaveBeenCalledWith(
      'Username: <@222222222222222200> would like to rename to "NewName". Allow?'
    );
    expect(moderatorMessage.react).toHaveBeenCalledWith("✅");
    expect(moderatorMessage.react).toHaveBeenCalledWith("🚫");
    expect(moderatorMessage.awaitReactions).toHaveBeenCalled();
    expect(moderator.getMember).toHaveBeenCalled();
    expect(getGuildMember.setNickname).toHaveBeenCalled();
    expect(moderatorMessage.delete).toHaveBeenCalled();
  });
});
