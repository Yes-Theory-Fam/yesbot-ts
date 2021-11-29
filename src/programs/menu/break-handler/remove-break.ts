import { UsersOnBreak } from "@yes-theory-fam/database/client";
import { GuildMember, DMChannel } from "discord.js";
import { textLog } from "../../../common/moderator";
import Tools from "../../../common/tools";
import {
  isCooldownDone,
  emojiCollector,
  logger,
  handleReactionTimeout,
} from "../common";

export const removeBreakRole = async (
  member: GuildMember,
  userData: UsersOnBreak,
  dmChannel: DMChannel
) => {
  const checkTime = await isCooldownDone(userData);

  if (!checkTime) {
    await dmChannel.send(
      "I'm sorry it hasn't been 24 hours since you used this command! If you really want the break role removed you can contact one of our moderators!"
    );
    return;
  }

  const breakRole = Tools.getRoleByName("Break", member.guild);
  const confirmationMessage = await dmChannel.send(
    "It looks like you're ready to rejoin the server! Once you're ready click on the green check below!"
  );
  await confirmationMessage.react("✅");

  const reaction = await emojiCollector(confirmationMessage);

  if (!reaction) {
    await handleReactionTimeout(confirmationMessage, dmChannel);
    return;
  }

  try {
    await member.roles.remove(breakRole);
    await dmChannel.send(
      "Your break role was removed, we're happy to have you back!"
    );
    return;
  } catch (e) {
    logger.error("Failed to remove break role", e);
    await textLog(`I could not remove <@${member.id}> break role!`);
    await dmChannel.send(
      "Looks like I had a little hiccup trying to remove your role, I've contacted Support about your little issue! Sorry in advance."
    );
    return;
  }
};
