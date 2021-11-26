import prisma from "../../../prisma";
import { GuildMember, DMChannel } from "discord.js";
import { textLog } from "../../../common/moderator";
import state from "../../../common/state";
import Tools from "../../../common/tools";
import { removeIgnore, logger, handleError, emojiCollector } from "../common";

export const addBreakRole = async (
  member: GuildMember,
  dmChannel: DMChannel
) => {
  const confirmationMessage = await dmChannel.send(
    "It looks like you want a little break! It is understandable you can get it by clicking on the :sloth: emoji below. You can send me !menu again to remove it.\n**BE ADVISED: THIS COMMAND CAN ONLY BE USED EVERY 24 HOURS**"
  );

  state.ignoredGroupDMs.push(dmChannel.id);

  const breakRole = Tools.getRoleByName("Break", member.guild);
  await confirmationMessage.react("🦥");

  const reaction = await emojiCollector(confirmationMessage, "🦥");

  if (reaction) {
    try {
      removeIgnore(dmChannel);
      await confirmationMessage.delete();
      await member.roles.add(breakRole);
      await prisma.usersOnBreak.create({ data: { userId: member.id } });
      dmChannel.send("Enjoy your break!");
      return;
    } catch (e) {
      logger.error("Failed to update break status", e);
      removeIgnore(dmChannel);
      await textLog(`I could not give <@${member.id}> the break role!`);
      dmChannel.send(
        "Looks like I couldn't give you the break role, I informed the Support team about it, in the meantime you can manually ask one of the Moderators!"
      );
      return;
    }
  }

  removeIgnore(dmChannel);
  await handleError(confirmationMessage, dmChannel);
};
