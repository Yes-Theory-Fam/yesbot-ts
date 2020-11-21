import {
  CollectorFilter,
  DMChannel,
  Message,
  MessageReaction,
  User,
} from "discord.js";
import state from "../common/state";
import { proposeNameChange } from "../common/CustomMethods";

const removeIgnore = (channel: DMChannel) => {
  const index = state.ignoredGroupDMs.indexOf(channel.id);
  if (index > -1) {
    state.ignoredGroupDMs.splice(index, 1);
  }
};

// This will probably need some larger refactoring when more functionality is added.
export const showMenu = async (message: Message) => {
  const dmChannel = message.channel as DMChannel;

  const nameChangeMessage = await message.reply(
    "Hey, I'm just a bot! Most of what I can do, I do on the YesFam discord, so talk to me there instead! I can help you change your name, though, if you're new around here. Click the :baby: if you want to change your name!"
  );
  await nameChangeMessage.react("👶");
  const filter: CollectorFilter = (reaction: MessageReaction, user: User) =>
    reaction.emoji.name === "👶" && !user.bot;
  try {
    const reactions = await nameChangeMessage.awaitReactions(filter, {
      time: 60000,
      max: 1,
    });
    if (reactions.size === 0) throw "No reactions";

    const requestMessage = await dmChannel.send(
      "Okay, what's your name then? Please only respond with your name like Henry or Julie, that makes things easier for the Supports! :upside_down:"
    );
    state.ignoredGroupDMs.push(dmChannel.id);
    const nameMessage = await dmChannel.awaitMessages(
      (_, user: User) => !user.bot,
      { time: 60000, max: 1 }
    );
    removeIgnore(dmChannel);

    if (nameMessage.size === 0) {
      requestMessage.delete();
      throw "No response";
    }

    const requestedName = nameMessage.first().content;
    proposeNameChange(requestedName, message);
    await requestMessage.delete();
  } catch (err) {
    removeIgnore(dmChannel);
    // Time's up; nothing to do here, really
    dmChannel.send(
      "Because of technical reasons I can only wait 60 seconds for a reaction. I removed the other message to not confuse you. If you need anything from me, just drop me a message!"
    );
  }

  await nameChangeMessage.delete();
};
