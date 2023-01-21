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
    label: "Done!",
    custom_id: buddyProjectConfirmsDmsUnblockedButtonId,
  });

  const components = new ActionRowBuilder<ButtonBuilder>({
    components: [button],
  });

  await channel.send({ content: blockedDmsInfo, components: [components] });
};

const blockedDmsInfo = `***How did I get here?***

YesBot couldn't message you!

Make sure that you allow other users to message you. To do this you have to check your privacy settings. You can sign up with your DMs on. You only need to have your DMs on during matching of the buddies. 

**On Desktop App**
Firstly click on the little down arrow next to the server name and a drop down menu will appear. Find the "Privacy Settings" button and click on it. A settings menu will appear on your screen. Check if the "Direct Messages" setting is on. 

**On Phone App** 
Swipe to the right of the screen and the server’s channels will show up. Up in the corner next to the server name, press the 3 little dots. A menu will appear on the screen. Scroll down until you find the "Allow Direct Messages" and check if the setting is on. 

Have you blocked YesBot? If you have blocked a user on Discord then the user can’t send a Direct Message to you. 

**On Desktop App**
Go to the Direct Messages page by clicking the Discord Logo up in the left corner of the app. Then click on the "Friends" button in the left corner to get your friend’s list up. Then you have to click on the "Blocked" button at the top of the screen (right next to the green "Add Friend" button. Now you should get your Blocked Users list up. Try to find YesBot and click on the "Unblock" button to the far right of the name (round button with an icon of a person and a cross in the right corner). 

**On Phone App**
Swipe to the right of the screen and the server’s channels will show up. A bar with 5 different icons will show up at the bottom of the screen. Click on your profile picture to the far right and a settings page will show up. Click on the "Account" option and a new settings page will show up. Scroll down until you see the "Blocked Users" option, click on it and a list of Blocked Users will show up. Try to find YesBot and click on the "Unblock" button to the far right of the name.`;
