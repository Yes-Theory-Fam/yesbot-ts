import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  Guild,
  TextChannel,
} from "discord.js";
import {
  ghostedRematchDifferenceHours,
  matchedGhostedDifferenceHours,
} from "../ghost/constants";
import { buddyProjectMarkGhostedButtonId } from "../ghost/mark-ghosted";

const ghostChannel = "buddy-project-ghost"; // TODO name to ChannelNames

export const buddyProjectGhostSetup = async (guild: Guild) => {
  const channel = guild.channels.cache.find(
    (c): c is TextChannel =>
      c.type === ChannelType.GuildText && c.name === ghostChannel
  );
  if (!channel) {
    throw new Error(
      `Failed to resolve channel with name ${ghostChannel} trying to set up Ghosting!`
    );
  }

  const messages = await channel.messages.fetch({ limit: 1, cache: true });
  if (messages.size) {
    throw new Error(
      "Refusing to add more messages! Encountered when setting up Ghosting!"
    );
  }

  const button = new ButtonBuilder({
    style: ButtonStyle.Danger,
    emoji: "👻",
    label: "I was ghosted!",
    custom_id: buddyProjectMarkGhostedButtonId,
  });

  const components = new ActionRowBuilder<ButtonBuilder>({
    components: [button],
  });
  await channel.send({
    // TODO content
    content: `Your buddy isn't responding to you? First of all: Rude! Second of all: Fear not, you can ~~publicly shame~~ report them.

If you didn't get a message from your buddy ${matchedGhostedDifferenceHours} hours after you got matched, just click the button below. I will try to poke them a bit and if I don't get anything either for ${ghostedRematchDifferenceHours} more hours, you will get another shot in the buddy lottery 🦥`,
    components: [components],
  });
};
