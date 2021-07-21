import { GuildMember, PartialGuildMember, TextChannel } from "discord.js";
import { isUserTimedOut, textLog } from "../common/moderator";
import prisma from "../prisma";
import { createYesBotLogger } from "../log";
import { ChatNames } from "../collections/chat-names";

const logger = createYesBotLogger("events", "memberLeave");

const memberLeave = async (member: GuildMember | PartialGuildMember) => {
  await removeFromBirthdays(member.id);
  await removeFromGroups(member.id);
  await reportUser(member);
};

// See https://www.prisma.io/docs/reference/api-reference/error-reference#p2025
const recordNotFoundCode = "P2025";

const removeFromBirthdays = async (userId: string) => {
  try {
    await prisma.birthday.delete({ where: { userId } });
  } catch (e) {
    if (e.code !== recordNotFoundCode) {
      logger.error("Removing from birthday DB failed: ", e);
      await textLog(
        `(MemberLeave) -> There was an error removing member from Birthday DB: ${userId}`
      );
    }
  }
};

const removeFromGroups = async (memberId: string) => {
  try {
    await prisma.userGroupMembersGroupMember.deleteMany({
      where: { groupMemberId: memberId },
    });
    await prisma.groupMember.delete({ where: { id: memberId } });
  } catch (e) {
    if (e.code !== recordNotFoundCode) {
      logger.error("Removing from groups DB failed: ", e);
      await textLog(
        `(MemberLeave) There was an error removing member from the group DB: ${memberId}`
      );
    }
  }
};

const reportUser = async (member: GuildMember | PartialGuildMember) => {
  if (!isUserTimedOut(member)) return;

  const botOutputChannel = member.guild.channels.cache.find(
    (channel) => channel.name === ChatNames.BOT_OUTPUT.toString()
  ) as TextChannel;
  botOutputChannel.send(
    `<@${member.id}>, left the server when he is still Timed Out!`
  );
};

export default memberLeave;
