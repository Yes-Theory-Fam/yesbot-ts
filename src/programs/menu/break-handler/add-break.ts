import { GuildMember, DMChannel } from "discord.js";
import { textLog } from "../../../common/moderator";
import Tools from "../../../common/tools";
import { logger, handleReactionTimeout, emojiCollector } from "../common";

export const addBreakRole = async (
  member: GuildMember,
  dmChannel: DMChannel
) => {
  const confirmationMessage = await dmChannel.send(
    "It looks like you want a little break! It is understandable you can get it by clicking on the :sloth: emoji below. You can send me !menu again to remove it.\n**Be advised: You can only use the sloth emoji to toggle your break role every 24 hours**"
  );

  const breakRole = Tools.getRoleByName("Break", member.guild);
  await confirmationMessage.react("🦥");

  const reaction = await emojiCollector(confirmationMessage);

  if (!reaction) {
    await handleReactionTimeout(confirmationMessage, dmChannel);
    return;
  }

  try {
    await confirmationMessage.delete();
    await member.roles.add(breakRole);
    await dmChannel.send("Enjoy your break!");
    return;
  } catch (e) {
    logger.error("Failed to add break role", e);
    await textLog(`I could not give <@${member.id}> the break role!`);
    await dmChannel.send(
      "Looks like I couldn't give you the break role, I informed the Support team about it, in the meantime you can manually ask one of the Moderators!"
    );
    return;
  }
};
