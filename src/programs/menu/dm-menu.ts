import { DMChannel, Message } from "discord.js";
import { getMember } from "../../common/moderator";
import state from "../../common/state";
import {
  Command,
  CommandHandler,
  DiscordEvent,
  EventLocation,
} from "../../event-distribution";
import { breakToggle } from "./break-handler/toggle-break";
import {
  emojiCollector,
  handleReactionTimeout,
  mainOptionsEmojis,
} from "./common";
import { nameCollector } from "./name-change";

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

    const optionsMessage = await message.reply(
      "Hey, I'm just a bot! Most of what I can do, I do on the YesFam discord, so talk to me there instead! I can help you change your name, though, if you're new around here. Click the :baby: if you want to change your name! Or if you feel like you need a break you can click on the :sloth:"
    );

    mainOptionsEmojis.forEach(
      async (emoji) => await optionsMessage.react(emoji)
    );

    try {
      const reactions = await emojiCollector(optionsMessage);

      switch (reactions.emoji.toString()) {
        case "👶":
          await nameCollector(dmChannel, message);
          break;
        case "🦥":
          await breakToggle(member, dmChannel);
      }
    } catch (err) {
      await handleReactionTimeout(optionsMessage, dmChannel);
    }

    await optionsMessage.delete();
  }
}
