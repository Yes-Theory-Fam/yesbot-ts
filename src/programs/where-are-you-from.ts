import {
  Guild,
  GuildMember,
  Message,
  PartialGuildMember,
  Role,
  TextChannel,
  User,
} from "discord.js";
import { isRegistered, textLog } from "../common/moderator";
import { countries, Country } from "../collections/flagEmojis";
import { CountryRoleFinder } from "../utils/country-role-finder";

const regionCountries = ["USA"];

const whereAreYouFrom = async (message: Message) => {
  const newUser = !isRegistered(message.member);

  if (newUser) {
    const matchedCountries = getCountriesFromMessage(message.content);

    if (matchedCountries.length > 1) {
      await message.reply(
        "Please only tell me 1 country for now, you can ask a member of the Support team about multiple nationalities :grin:"
      );
      return;
    }

    const countryToAssign = matchedCountries[0];
    if (countryToAssign) {
      const roleToAssign = getRoleForCountry(countryToAssign, message.guild);
      // const memberDm = await message.author.createDM();

      if (!roleToAssign) {
        const moderatorRole = message.guild.roles.cache.find(
          (r) => r.name === process.env.MODERATOR_ROLE_NAME
        );
        await textLog(
          `${moderatorRole.toString()}: <@${
            message.author.id
          }> just requested role for country ${
            countryToAssign.name
          }, but I could not find it. Please make sure this role exists.`
        );
        await welcomeMember(message.author, message.guild);
        return;
      }
      await message.member.roles.add(roleToAssign);
      await message.react("👍");
      const isCountryWithRegionRole = regionCountries.some(
        (countryName) =>
          CountryRoleFinder.getCountryByRole(roleToAssign.name) === countryName
      );

      const rules = message.guild.channels.cache.find(
        (c) => c.name === "rules"
      );
      const generalInfo = message.guild.channels.cache.find(
        (c) => c.name === "general-info"
      );

      if (!isCountryWithRegionRole) {
        await welcomeMember(message.member.user, message.member.guild);
      }
      // await memberDm.send(
      //   `Hey! My name is YesBot, I'm so happy to see you've made it into our world, we really hope you stick around!\n\nIn the meantime, you should checkout ${rules.toString()} and ${generalInfo.toString()} , they contain a lot of good-to-knows about our server and what cool stuff you can do.\nIf you'd like me to change your name on the server for you, just message me \`!menu\` and I will help you out! Then I can introduce you to our family :grin:\n\nI know Discord can be a lot to take in at first, trust me, but it's really quite a wonderful place.`
      // );

      if (isCountryWithRegionRole) {
        const lowerCaseCountry = CountryRoleFinder.getCountryByRole(
          roleToAssign.name
        ).toLowerCase();
        await ghostPing(message, lowerCaseCountry);
      }
    }
  }
};

const welcomeMember = async (user: User, guild: Guild) => {
  const memberRole = guild.roles.cache.find(({ name }) => name === "Member");
  await guild.member(user).roles.add(memberRole);

  const welcomeChat = <TextChannel>(
    guild.channels.cache.find((c) => c.name === "welcome-chat")
  );
  await welcomeChat.send(getWelcomeMessage(user));
};

const getWelcomeMessage = (user: User) => {
  const welcomeMessages = [
    `${user.toString()} just joined the party! Make some noise everyone :zany_face:`,
    `${user.toString()} just *sliiiiid* into the server.`,
    `Everyone welcome ${user.toString()}!`,
    `Welcome ${user.toString()}, say hi! `,
    `Glad you're finally here ${user.toString()}, we've been waiting for you :heart_eyes: `,
    `Welcome ${user.toString()}. We hope you brought :pizza: `,
    `${user.toString()} just hopped in :rabbit2: What a lovely day! `,
    `Yayyyy, ${user.toString()} made it!`,
    `${user.toString()} just showed up, make some space for them! `,
    `${user.toString()} is here :tada:`,
    `${user.toString()} just landed :rocket:`,
  ];
  return welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
};

export const getRoleForCountry = (country: Country, guild: Guild): Role => {
  return guild.roles.cache.find((role) =>
    CountryRoleFinder.isRoleFromCountry(country, role)
  );
};

const ghostPing = async (message: Message, region: String) => {
  const regionChannel = message.guild.channels.cache.find(
    (channel) => channel.name === `${region}-regions`
  ) as TextChannel;
  const ping = await regionChannel.send(`<@${message.member}>`);
  await ping.delete();
};

export const getCountriesFromMessage = (message: string) => {
  const matchedCountries = countries.filter((country: Country) => {
    return (
      message.includes(country.emoji) ||
      message.match(RegExp(`\\b${country.name}\\b`, "i"))
    );
  });

  return matchedCountries.filter(
    ({ name: filterName }, index, self) =>
      self.findIndex(({ name }) => name === filterName) === index
  );
};

export const updateAfterRegionSelect = async (
  oldMember: GuildMember | PartialGuildMember,
  newMember: GuildMember | PartialGuildMember
) => {
  const gainedRole = oldMember.roles.cache.size < newMember.roles.cache.size;
  if (!gainedRole) return;

  const findGeneralRole = (member: GuildMember | PartialGuildMember) =>
    member.roles.cache.find(({ name }) => {
      return regionCountries.some(
        (countryName) =>
          CountryRoleFinder.getCountryByRole(name) === countryName
      );
    });

  const hasSpecificRole = (
    member: GuildMember | PartialGuildMember,
    role: Role
  ) => {
    const emoji = role.name.split(" ").pop();

    return member.roles.cache.some(
      ({ name }) => name.includes("(") && name.includes(emoji)
    );
  };

  const generalRole = findGeneralRole(oldMember);
  if (generalRole && hasSpecificRole(newMember, generalRole)) {
    await newMember.roles.remove(generalRole);
    const hasNoOtherCountry = oldMember.roles.cache.every(
      (role) => role.id !== process.env.MEMBER_ROLE_ID
    );

    if (hasNoOtherCountry) {
      await welcomeMember(oldMember.user, oldMember.guild);
    }
  }
};

export default whereAreYouFrom;
