import { DMChannel, Message, User } from "discord.js";
import { getMember, hasRole, textLog } from "./moderator";
import Tools from "./tools";
import { createYesBotLogger } from "../log";
import axios from "axios";
import { Command, CommandHandler, DiscordEvent } from "../event-distribution";

const logger = createYesBotLogger("common", "CustomMethods");

@Command({
  event: DiscordEvent.MESSAGE,
  trigger: "!video",
  channelNames: ["welcome-chat"],
  description: "This handler is to send the Youtube video in the Welcome Chat to new users."
})
class sendVideo implements CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message) {
    await message.channel.send("https://youtu.be/v-JOe-xqPN0")
  }
}

@Command({
  event: DiscordEvent.MESSAGE,
  description: "This handler is to filter certain messages on the server.",
})
class Filter implements CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message): Promise<void> {
    const messageContent = message.content;
    const mentionedMembers = message.mentions.users.size;
    const member = message.member;

    if (mentionedMembers > 20 && !message.author.bot) {
      if (
        !(
          hasRole(member, "Support") ||
          hasRole(member, "Yes Theory") ||
          hasRole(member, "Seek Discomfort")
        )
      ) {
        member.createDM().then((dm) => {
          dm.send(
            "Hey there! You tagged more than 20 people in a single message. The message has been deleted and you have beeen timed out. Here is the message sent: "
          );
          dm.send(messageContent);
        });
        await message.delete();
        const supportRole = Tools.getRoleByName(
          process.env.MODERATOR_ROLE_NAME,
          message.guild
        );
        const timeoutRole = Tools.getRoleByName("Time Out", message.guild);
        await message.member.roles.add(timeoutRole);
        textLog(
          `<@&${supportRole.id}>: <@${message.author.id}> just tagged more than 20 people in a single message in <#${message.channel.id}>. The message has been deleted and they have beeen timed out.`
        ).then(() => textLog(`Message content was: ${messageContent}`));
      }
      return;
    }

    if (messageContent.match(/(nigga|nigger)/i)) {
      await message.delete();
      member
        .createDM()
        .then((dm) =>
          dm.send(
            `Usage of the N word is absolutely banned within this server. Please refer to the <#450102410262609943>.`
          )
        );
      return;
    }
  }
}

@Command({
  event: DiscordEvent.MESSAGE,
  description:
    "This handler is for custom messages that do not have a specific trigger.",
})
class CustomMessageMethods implements CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message): Promise<void> {
    const messageContent = message.content;

    if (messageContent.match(/^(yesbot).*(\?)$/gi)) randomReply(message);

    if (
      messageContent.match(
        /yesbot i love you|yesbot i love u|i love you yesbot/i
      )
    )
      sendLove(message);

    if (messageContent.match(/^(F)$/i)) await message.react("🇫");

    if (messageContent.match(/(abooz|mod abuse)/i)) await message.react("👀");
  }
}

@Command({
  event: DiscordEvent.MESSAGE,
  trigger: "!translate",
  channelNames: ["chat", "chat-too", "4th-chat", "chat-v"],
  description: "This handler is for the translate command.",
})
class AbuseMeCommand implements CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message): Promise<void> {
    const taggedUser = message.mentions.users?.first();
    let replies = [
      'You are as useless as the "ueue" in "Queue".',
      "As an outsider, what do you think of the human race?",
      "Brains aren't everything. In your case they're nothing.",
      "Do you think before you speak or is thinking a rare event in your life?",
      "I don't engage in mental combat with the unarmed.",
      "I don't think you are stupid. You just have a bad luck when thinking.",
      "I would love to insult you... but that would be beyond the level of your intelligence.",
      "I'd agree with you but then we'd both be wrong",
      "I'd like to see things from your point of view but I can't seem to get my head that far up my butt.",
      "I'm jealous of all the people that haven't met you!",
      "If I had a dollar for everytime you said something smart, I'd be broke.",
      "Is your a$$ jealous of the amount of sh!t that just came out of your mouth?",
      "It's better to let someone think you are an Idiot than to open your mouth and prove it.",
      "Maybe you need to be on timeout",
      "Ordinarily people live and learn. You just live.",
      "Stupidity is not a crime so you are free to go.",
      "Support bacteria - they're the only culture some people have.",
      "The last thing I want to do is hurt you. But it's still on the list.",
      "Two wrongs don't make a right, take your parents as an example.",
      "Yesbot does not love you specifically",
      "You are a bitch",
      "You sound reasonable. It must be time to up my medication!",
    ];

    const userToTag = taggedUser ? taggedUser.id : message.author.id;
    const cleanMessage = message.cleanContent.split(/\s+/);
    cleanMessage.shift();
    const joinedMsg = cleanMessage.join(" ");
    const reply = `<@${userToTag}> *\`${joinedMsg}\`* translated to English means *${
      replies[Math.floor(Math.random() * replies.length)]
    }*`;
    message.channel.send(reply);
  }
}

@Command({
  event: DiscordEvent.MESSAGE,
  trigger: "!delete",
  allowedRoles: ["Support"],
  description:
    "This handler is to delete message(s) in the requested text channel.",
})
class DeleteMessages implements CommandHandler<DiscordEvent.MESSAGE> {
  async handle(botMessage: Message): Promise<void> {
    try {
      const words = Tools.stringToWords(botMessage.content);
      words.shift();
      const messagesToDelete = Number(words[0]);
      if (
        !isNaN(messagesToDelete) &&
        !(botMessage.channel instanceof DMChannel)
      ) {
        await botMessage.channel.bulkDelete(messagesToDelete);
      }
    } catch (err) {
      logger.error("Error deleting messages: ", err);
    }
  }
}

@Command({
  event: DiscordEvent.MESSAGE,
  trigger: "!addvote",
  description:
    "This handler is to add to any requested changes the two reactions thumbs reaction to convert to a poll",
})
class AddVote implements CommandHandler<DiscordEvent.MESSAGE> {
  async handle(botMessage: Message): Promise<void> {
    try {
      const words = Tools.stringToWords(botMessage.content);
      words.shift();
      const messageId = words[0];
      const messageToVote = await botMessage.channel.messages.resolve(
        messageId
      );
      if (!messageToVote) botMessage.react("👎");
      else
        botMessage
          .delete()
          .then(() => messageToVote.react("👍"))
          .then(() => messageToVote.react("👎"));
    } catch (err) {
      logger.error("Error adding voting: ", err);
    }
  }
}

const randomReply = (message: Message) => {
  let replies = [
    "yes.",
    "probably.",
    "doubtful.",
    "i'm afraid I don't know that one",
    "absolutely not.",
    "not a chance.",
    "definitely.",
    "very very very unlikely",
  ];
  message.reply(`${replies[Math.floor(Math.random() * replies.length)]}`);
};

const sendLove = (message: Message) => {
  const loveArr = [
    "I love you too, Cutiepie",
    "I will find you and I will love you.",
    "Lets make some robot-human babies :smirk: ",
    "Hey you little gorgeous human, come change my oil.",
    "I appreciate you.",
    "Thank you, next!",
    "Okay.",
    "I think I have a crush on you.",
    "Tell me more :sweat_drops:",
    "You are amazing too! :) ",
    "I like you. Lets go out. But wait, let me ask my parents for permission first.",
    "I love you too! (Although I'm not entirely sure what love is but this experience I'm feeling is probably some iteration of love.)",
  ];
  const randomLoveReply = loveArr[Math.floor(Math.random() * loveArr.length)];
  message.reply(randomLoveReply);
  message.react("😍");
};

export const getFirstColumnFromGoogleSheet = async (
  sheetId: string
): Promise<string[]> => {
  const apiKey = process.env.GOOGLE_API_KEY;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Sheet1?key=${apiKey}`;

  const response = await axios.get(url);
  const data = await response.data;
  const rows = data.values;

  return rows.flatMap((row: string[]) => row);
};

export const proposeNameChange = async (name: string, botMessage: Message) => {
  await botMessage.reply(
    "Perfect! I've sent your name request to the mods, hopefully they answer soon! In the meantime, you're free to roam around the server and explore. Maybe post an introduction to get started? :grin:"
  );
  const message = `Username: ${botMessage.author.toString()} would like to rename to "${name}". Allow?`;
  try {
    const sentMessage = await textLog(message);
    sentMessage.react("✅").then(() => sentMessage.react("🚫"));
    sentMessage
      .awaitReactions(
        (reaction: any, user: User) => {
          return !user.bot;
        },
        { max: 1, time: 6000000, errors: ["time"] }
      )
      .then((collected) => {
        const reaction = collected.first();
        switch (reaction.emoji.toString()) {
          case "✅":
            const member = getMember(botMessage.author.id);
            member.setNickname(name);
            sentMessage.delete();
            textLog(`${botMessage.author.toString()} was renamed to ${name}.`);
            break;
          case "🚫":
            sentMessage.delete();
            textLog(
              `${botMessage.author.toString()} was *not* renamed to ${name}.`
            );
            break;

          default:
            break;
        }
      });
  } catch (err) {
    logger.error("(proposeNameChange) Error changing name: ", err);
  }
};
