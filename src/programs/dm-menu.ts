import {
  CollectorFilter,
  DMChannel,
  Message,
  MessageReaction,
  User,
} from "discord.js";
import state from "../common/state";
import {
  Command,
  CommandHandler,
  DiscordEvent,
  EventLocation,
} from "../event-distribution";
import { getMember, textLog } from "../common/moderator";
import { Game } from ".";
import { createYesBotLogger } from "../log";

const logger = createYesBotLogger("programs", "DmMenu");

const removeIgnore = (channel: DMChannel) => {
  const index = state.ignoredGroupDMs.indexOf(channel.id);
  if (index > -1) {
    state.ignoredGroupDMs.splice(index, 1);
  }
};

@Command({
  event: DiscordEvent.MESSAGE,
  location: EventLocation.DIRECT_MESSAGE,
  description: "This handler is temporarily until we refactor games.ts",
})
class HandleGameInput implements CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message) {
    //Since game.ts isn't refactored this is a temporarily solution for it not to be "nuked"
    Game.handleGameInput(message);
  }
}

@Command({
  event: DiscordEvent.MESSAGE,
  trigger: "!menu",
  location: EventLocation.DIRECT_MESSAGE,
  description: "This handler is for the DM menu",
})
class ShowMenu implements CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message): Promise<void> {
    const member = getMember(message.author.id);
    const dmChannel = message.channel as DMChannel;

    if (!member) {
      await dmChannel.send(
        "Hey, I am the bot of the Yes Theory Fam Discord Server :) Looks like you are not on it currently, so I cannot really do a lot for you. If you'd like to join, click here: https://discord.gg/yestheory"
      );
      return;
    }

    if (state.ignoredGroupDMs.includes(dmChannel.id)) return;

    const nameChangeMessage = await message.reply(
      "Hey, I'm just a bot! Most of what I can do, I do on the YesFam discord, so talk to me there instead! I can help you change your name, though, if you're new around here. Click the :baby: if you want to change your name!"
    );
    await nameChangeMessage.react("👶");
    const filter: CollectorFilter<[MessageReaction, User]> = (reaction, user) =>
      reaction.emoji.name === "👶" && !user.bot;
    try {
      const reactions = await nameChangeMessage.awaitReactions({
        filter,
        time: 60000,
        max: 1,
      });
      if (reactions.size === 0) throw "No reactions";

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
    } catch (err) {
      removeIgnore(dmChannel);
      // Time's up; nothing to do here, really
      dmChannel.send(
        "Because of technical reasons I can only wait 60 seconds for a reaction. I removed the other message to not confuse you. If you need anything from me, just drop me a message!"
      );
    }

    await nameChangeMessage.delete();
  }
}

const proposeNameChange = async (name: string, botMessage: Message) => {
  await botMessage.reply(
    "Perfect! I've sent your name request to the mods, hopefully they answer soon! In the meantime, you're free to roam around the server and explore. Maybe post an introduction to get started? :grin:"
  );
  const message = `Username: ${botMessage.author.toString()} would like to rename to "${name}". Allow?`;
  try {
    const sentMessage = await textLog(message);
    sentMessage.react("✅").then(() => sentMessage.react("🚫"));
    sentMessage
      .awaitReactions({
        filter: (_, user: User) => {
          return !user.bot;
        },
        max: 1,
        time: 6000000,
        errors: ["time"],
      })
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
