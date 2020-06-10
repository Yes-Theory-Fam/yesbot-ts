import Discord, {
  Snowflake,
  TextChannel,
  GuildMember,
  Message,
  MessageEmbed,
} from "discord.js";
import Tools from "../common/tools";
import { MODERATOR_ROLE_NAME } from "../const";
import { UserGroupRepository } from "../entities/UserGroup";
import { formatBirthday, getUserBirthday } from "./BirthdayManager";

interface DiscordGroup {
  name: String;
  members: String[];
}

export default async function ProfileManager(
  pMessage: Discord.Message,
  commandIndex: number
) {
  const { content } = pMessage;

  if (content.startsWith("!profile")) {
    const words = Tools.stringToWords(content);
    words.shift();
    const [requestedProfileUser] = words;

    let requestedUser = pMessage.mentions.users.first();
    if (!requestedUser) requestedUser = pMessage.member.user;
    const requestedMember = pMessage.guild.members.cache.find(
      (m) => m.user === requestedUser
    );

    if (!requestedMember) {
      pMessage.reply("I couldn't find that member in this server!");
      return;
    }
    const profileEmbed = await getProfileEmbed(requestedMember, pMessage);
    pMessage.channel.send(profileEmbed);
  }
}
interface Birthday {
  id: string;
  date: string;
}

const getProfileEmbed = async (
  member: GuildMember,
  message: Message
): Promise<MessageEmbed> => {
  const groupRepository = await UserGroupRepository();

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
  const yesEmoji = member.guild.emojis.cache.find((e) => e.name == "yes_yf");
  const birthdayString = formatBirthday(await getUserBirthday(member.user.id));
  if (!countryRole) {
    message.reply("That user isn't registered here!");
    return null;
  }

  const groups = await groupRepository
    .createQueryBuilder("usergroup")
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
