import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  Guild,
  TextChannel,
} from "discord.js";
import { ChatNames } from "../../../collections/chat-names";
import { buddyProjectConfirmsDmsUnblockedButtonId } from "../matching/confirm-dms-unblocked";

export const buddyProjectDmsBlockedSetup = async (guild: Guild) => {
  const channel = guild.channels.cache.find(
    (c): c is TextChannel =>
      c.type === ChannelType.GuildText &&
      c.name === ChatNames.BUDDY_PROJECT_DMS_DISABLED
  );

  if (!channel) {
    throw new Error(
      `Failed to resolve channel with name ${ChatNames.BUDDY_PROJECT_DMS_DISABLED} trying to set up blocked DMs!`
    );
  }

  const button = new ButtonBuilder({
    style: ButtonStyle.Success,
    emoji: "✅",
    label: "Done!",
    custom_id: buddyProjectConfirmsDmsUnblockedButtonId,
  });

  const components = new ActionRowBuilder<ButtonBuilder>({
    components: [button],
  });

  await channel.send({ content: "TODO", components: [components] });
};
