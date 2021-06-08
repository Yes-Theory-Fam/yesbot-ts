import { Message } from "discord.js";
import Tools from "../common/tools";

export default async function DeadchatGroup(pMessage: Message) {
  const isDead =
    Date.now() -
      (await pMessage.channel.messages.fetch({ limit: 2 })).array()[1]
        .createdTimestamp >
    900000; //|| pMessage.guild.name != "Yes Theory Fam";

  if (!isDead) {
    await Tools.handleUserError(
      pMessage,
      "Chat is not dead! You can ping this group if there have been no messages in the last 15 minutes."
    );
    return;
  } else {
    return true;
  }
}
