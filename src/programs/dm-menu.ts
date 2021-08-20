import {
  CollectorFilter,
  DMChannel,
  Message,
  MessageReaction,
  User,
} from "discord.js";
import state from "../common/state";
import { proposeNameChange } from "../common/custom-methods";
<<<<<<< HEAD
import {
  Command,
  CommandHandler,
  DiscordEvent,
  EventLocation,
} from "../event-distribution";
=======
import { Command, CommandHandler, DiscordEvent, EventLocation } from "../event-distribution";
>>>>>>> 17a089f (rewritten dm-menu.ts)
import { getMember } from "../common/moderator";

const removeIgnore = (channel: DMChannel) => {
  const index = state.ignoredGroupDMs.indexOf(channel.id);
  if (index > -1) {
    state.ignoredGroupDMs.splice(index, 1);
  }
};

@Command({
  event: DiscordEvent.MESSAGE,
  trigger: "!menu",
  description: "This handler is for the DM menu",
  location: EventLocation.DIRECT_MESSAGE
})
class ShowDmMenu implements CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message) {

    const member = getMember(message.author.id)
    const dmChannel = message.channel as DMChannel;

    if (!member) {
      dmChannel.send("Hey, I am the bot of the Yes Theory Fam Discord Server :) Looks like you are not on it currently, so I cannot really do a lot for you. If you'd like to join, click here: https://discord.gg/yestheory")
      return;
    }

    if (state.ignoredGroupDMs.includes(dmChannel.id)) return;
    
    

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

    if (!member) {
      dmChannel.send(
        "Hey, I am the bot of the Yes Theory Fam Discord Server :) Looks like you are not on it currently, so I cannot really do a lot for you. If you'd like to join, click here: https://discord.gg/yestheory"
      );
      return;
    }

    if (state.ignoredGroupDMs.includes(dmChannel.id)) return;

    const nameChangeMessage = await message.reply(
      "Hey, I'm just a bot! Most of what I can do, I do on the YesFam discord, so talk to me there instead! I can help you change your name, though, if you're new around here. Click the :baby: if you want to change your name!"
    );
  }
  await nameChangeMessage.delete();
  }
}
