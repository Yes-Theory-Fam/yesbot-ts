import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  Guild,
  TextChannel,
} from "discord.js";
import { ChatNames } from "../../../../collections/chat-names.js";
import {
  ghostedRematchDifferenceHours,
  matchedGhostedDifferenceHours,
} from "../../ghost/constants.js";
import { buddyProjectMarkGhostedButtonId } from "../../ghost/mark-ghosted.js";

export const buddyProjectGhostSetup = async (guild: Guild) => {
  const channel = guild.channels.cache.find(
    (c): c is TextChannel =>
      c.type === ChannelType.GuildText &&
      c.name === ChatNames.BUDDY_PROJECT_INFO
  );
  if (!channel) {
    throw new Error(
      `Failed to resolve channel with name ${ChatNames.BUDDY_PROJECT_INFO} trying to set up Ghosting!`
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
    content: `**What if my buddy doesn't respond?**
    
Your buddy isn't responding to you? First of all: Rude! Second of all: Fear not, you can ~~publicly shame~~ report them.

If you didn't get a message from your buddy ${matchedGhostedDifferenceHours} hours after you got matched, just click the button below. I will try to poke them a bit and if I don't get anything either for ${ghostedRematchDifferenceHours} more hours, you will get another shot in the buddy lottery 🦥`,
    components: [components],
  });
};
