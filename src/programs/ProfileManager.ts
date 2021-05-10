import { GuildMember, Message, MessageEmbed } from "discord.js";
import Tools from "../common/tools";
import { UserGroup } from "../entities";
import { formatBirthday, getUserBirthday } from "./BirthdayManager";

export default async function ProfileManager(pMessage: Message) {
  const { content } = pMessage;

  if (content.startsWith("!profile")) {
    const words = Tools.stringToWords(content);
    words.shift();

    const requestedUser =
      pMessage.mentions.users.first() || pMessage.member.user;
    const requestedMember = pMessage.guild.member(requestedUser);

    if (!requestedMember) {
      Tools.handleUserError(
        pMessage,
        "I couldn't find that member in this server!"
      );
      return;
    }
    const profileEmbed = await getProfileEmbed(requestedMember, pMessage);
    pMessage.channel.send(profileEmbed);
  }
}

const getProfileEmbed = async (
  member: GuildMember,
  message: Message
): Promise<MessageEmbed> => {
  const profileEmbed = new MessageEmbed();
  const countryRole = member.roles.cache.find((r) =>
    r.name.includes("I'm from")
  );
  let countryString = "";
  member.roles.cache.forEach((role) => {
    if (role.name.includes("I'm from")) {
      countryString = countryString + role.name + "\n";
    }
  });
  const yesEmoji = member.guild.emojis.cache.find((e) => e.name == "yes");
  const birthdayString = formatBirthday(await getUserBirthday(member.user.id));
  if (!countryRole) {
    message.reply("That user isn't registered here!");
    return null;
  }

  const groups = await UserGroup.createQueryBuilder("usergroup")
    .leftJoinAndSelect("usergroup.members", "groupmember")
    .where("groupmember.id = :id", { id: member.id })
    .getMany();

  const groupString = groups.map((group) => group.name).join(", ");

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
