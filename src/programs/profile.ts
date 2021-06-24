import { GuildMember, Message, MessageEmbed } from "discord.js";
import Tools from "../common/tools";
import { formatBirthday, getUserBirthday } from "./birthday-manager";
import prisma from "../prisma";
import { CountryRoleFinder } from "../utils/country-role-finder";

const profile = async (message: Message) => {
  const { content } = message;

  if (content.startsWith("!profile")) {
    const words = Tools.stringToWords(content);
    words.shift();

    const requestedUser = message.mentions.users.first() || message.member.user;
    const requestedMember = message.guild.member(requestedUser);

    if (!requestedMember) {
      await Tools.handleUserError(
        message,
        "I couldn't find that member in this server!"
      );
      return;
    }
    const profileEmbed = await getProfileEmbed(requestedMember, message);
    await message.channel.send(profileEmbed);
  }
};

const getProfileEmbed = async (
  member: GuildMember,
  message: Message
): Promise<MessageEmbed> => {
  const profileEmbed = new MessageEmbed();
  const countryRole = member.roles.cache.find((role) =>
    CountryRoleFinder.isCountryRole(role.name)
  );
  let countryString = "";
  member.roles.cache.forEach((role) => {
    if (CountryRoleFinder.isCountryRole(role.name)) {
      countryString += role.name + "\n";
    }
  });
  const yesEmoji = member.guild.emojis.cache.find((e) => e.name == "yes");
  const birthdayString = formatBirthday(await getUserBirthday(member.user.id));
  if (!countryRole) {
    await message.reply("That user isn't registered here!");
    return null;
  }

  const memberWithGroups = await prisma.groupMember.findFirst({
    where: {
      id: member.id,
    },
    include: {
      userGroupMembersGroupMembers: {
        include: { userGroup: { select: { name: true } } },
      },
    },
  });

  const groupString = memberWithGroups?.userGroupMembersGroupMembers
    .map(({ userGroup: { name } }) => name)
    .join(", ");

  const joinDate = member.joinedAt.toDateString();
  profileEmbed.setThumbnail(member.user.avatarURL());
  profileEmbed.setTitle(
    yesEmoji.toString() +
      " " +
      member.user.username +
      "#" +
      member.user.discriminator
  );
  profileEmbed.setColor(member.roles.color.color);
  profileEmbed.addField("Hi! My name is:", member.displayName, true);
  profileEmbed.addField("Where I'm from:", countryString, true);
  profileEmbed.addField("\u200b", "\u200b");
  profileEmbed.addField("Joined on:", joinDate, true);
  profileEmbed.addField("Birthday:", birthdayString, true);
  profileEmbed.addField("Groups:", groupString || "None", true);
  profileEmbed.setFooter(
    "Thank you for using the Yes Theory Fam Discord Server!"
  );
  return profileEmbed;
};

export default profile;
