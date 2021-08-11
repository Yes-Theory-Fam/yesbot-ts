import { Message, TextChannel } from "discord.js";
import { hasRole, textLog } from "../common/moderator";
import Tools from "../common/tools";

const timeoutUser = async (message: Message) => {
  const targetedUser = message.mentions.users.first();
  if (!targetedUser) {
    return Tools.handleUserError(
      message,
      "You have to ping the user you want to timeout!"
    );
  }
  const targetedGuildMember = message.guild.members.resolve(targetedUser);
  const timeoutRole = message.guild.roles.cache.find(
    (r) => r.name === "Time Out"
  );

  if (hasRole(targetedGuildMember, "Time Out")) {
    return Tools.handleUserError(message, "User is already timed out!");
  }
  await targetedGuildMember.roles.add(timeoutRole);
  message.reply(`<@${targetedUser.id}> was timed out!`);
  await textLog(
    `<@${targetedUser.id}> has been timed out! By ${message.author}`
  );
};

export default timeoutUser;
