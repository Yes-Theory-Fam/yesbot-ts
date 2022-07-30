import { GuildMember, Message, EmbedBuilder } from "discord.js";
import Tools from "../common/tools";
import { formatBirthday, getUserBirthday } from "./birthday-manager";
import prisma from "../prisma";
import { CountryRoleFinder } from "../common/country-role-finder";
import { Command, CommandHandler, DiscordEvent } from "../event-distribution";

@Command({
  event: DiscordEvent.MESSAGE,
  trigger: "!profile",
  channelNames: ["bot-commands", "permanent-testing"],
  description:
    "This handler is to show the user profile or the mentioned user.",
})
class Profile implements CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message): Promise<void> {
    const requestedMember = message.mentions.members?.first() ?? message.member;

    if (!requestedMember) {
      await Tools.handleUserError(
        message,
        "I couldn't find that member in this server!"
      );
      return;
    }

    const profileEmbed = await getProfileEmbed(requestedMember);
    const messageContent =
      profileEmbed instanceof EmbedBuilder
        ? { embeds: [profileEmbed] }
        : { content: profileEmbed };

    await message.channel.send(messageContent);
  }
}

const getProfileEmbed = async (
  member: GuildMember
): Promise<EmbedBuilder | string> => {
  const profileEmbed = new EmbedBuilder();
  const countries = member.roles.cache
    .filter((role) => {
      return CountryRoleFinder.isCountryRole(role.name, true);
    })
    .map(({ name }) => name);
  const countryString = countries.join("\n");
  const yesEmoji = member.guild.emojis.cache.find((e) => e.name == "yes");
  const birthdayString = formatBirthday(await getUserBirthday(member.user.id));
  if (countries.length === 0) {
    return "That user isn't registered here!";
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

  const joinDate = member.joinedAt?.toDateString();
  const avatarUrl = member.user.avatarURL();
  if (avatarUrl) {
    profileEmbed.setThumbnail(avatarUrl);
  }
  profileEmbed.setTitle(
    (yesEmoji?.toString() ?? "") +
      " " +
      member.user.username +
      "#" +
      member.user.discriminator
  );
  profileEmbed.setColor(member.roles.color?.color ?? "#004dff");
  profileEmbed.setFields([
    { name: "Hi! My name is:", value: member.displayName, inline: true },
    { name: "Where I'm from:", value: countryString, inline: true },
    { name: "\u200b", value: "\u200b" },
    { name: "Joined on:", value: joinDate ?? "Unknown", inline: true },
    { name: "Birthday:", value: birthdayString, inline: true },
    { name: "Groups:", value: groupString || "None", inline: true },
  ]);
  profileEmbed.setFooter({
    text: "Thank you for using the Yes Theory Fam Discord Server!",
  });
  return profileEmbed;
};
