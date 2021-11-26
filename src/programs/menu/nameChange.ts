import { Message, DMChannel } from "discord.js";
import { textLog, getMember } from "../../common/moderator";
import state from "../../common/state";
import { emojiCollector, logger, removeIgnore } from "./common";

export const proposeNameChange = async (name: string, botMessage: Message) => {
  await botMessage.reply(
    "Perfect! I've sent your name request to the mods, hopefully they answer soon! In the meantime, you're free to roam around the server and explore. Maybe post an introduction to get started? :grin:"
  );
  const message = `Username: ${botMessage.author.toString()} would like to rename to "${name}". Allow?`;
  try {
    const sentMessage = await textLog(message);
    await sentMessage.react("✅").then(() => sentMessage.react("🚫"));

    const reaction = await emojiCollector(sentMessage);

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
  } catch (err) {
    logger.error("(proposeNameChange) Error changing name: ", err);
  }
};

export const nameCollector = async (dmChannel: DMChannel, message: Message) => {
  const requestMessage = await dmChannel.send(
    "Okay, what's your name then? Please only respond with your name like Henry or Julie, that makes things easier for the Supports! :upside_down:"
  );
  state.ignoredGroupDMs.push(dmChannel.id);
  const nameMessage = await dmChannel.awaitMessages({
    filter: (message) => !message.author.bot,
    time: 60000,
    max: 1,
  });
  removeIgnore(dmChannel);

  if (nameMessage.size === 0) {
    requestMessage.delete();
    throw "No response";
  }

  const requestedName = nameMessage.first().content;
  proposeNameChange(requestedName, message);
  await requestMessage.delete();
};
