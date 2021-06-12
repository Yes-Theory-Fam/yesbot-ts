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
import { Country, countries } from "../collections/flagEmojis";
import { Unassigned } from ".";

const regionCountries = ["Australia", "Canada", "UK", "USA"];

export default async function WhereAreYouFromManager(pMessage: Message) {
  const newUser = !isRegistered(pMessage.member);

  if (newUser) {
    const matchedCountries = getCountriesFromMessage(pMessage.content);

    if (matchedCountries.length > 1) {
      await pMessage.reply(
        "Please only tell me 1 country for now, you can ask a member of the Support team about multiple nationalities :grin:"
      );
      return;
    }

    const countryToAssign = matchedCountries[0];
    if (countryToAssign) {
      const roleToAssign = getRoleForCountry(countryToAssign, pMessage.guild);

      if (!roleToAssign) {
        const moderatorRole = pMessage.guild.roles.cache.find(
          (r) => r.name === process.env.MODERATOR_ROLE_NAME
        );
        await textLog(
          `${moderatorRole.toString()}: <@${
            pMessage.author.id
          }> just requested role for country ${
            countryToAssign.name
          }, but I could not find it. Please make sure this role exists.`
        );
        return;
      }
      await pMessage.member.roles.add(roleToAssign);
      await pMessage.react("👍");
      pMessage.member.createDM().then((dmChannel) => {
        const rules = pMessage.guild.channels.cache.find(
          (c) => c.name === "rules"
        );
        const generalInfo = pMessage.guild.channels.cache.find(
          (c) => c.name === "general-info"
        );

        const isCountryWithRegionRole = regionCountries.some((country) =>
          roleToAssign.name.endsWith(`${country}!`)
        );
        if (!isCountryWithRegionRole) {
          welcomeMember(pMessage.member.user, pMessage.member.guild);
        }
        Unassigned.UnassignedMemberUpdate(pMessage.member);
        dmChannel.send(
          `Hey! My name is YesBot, I'm so happy to see you've made it into our world, we really hope you stick around!\n\nIn the meantime, you should checkout ${rules.toString()} and ${generalInfo.toString()} , they contain a lot of good-to-knows about our server and what cool stuff you can do.\nIf you'd like me to change your name on the server for you, just drop me a message and I will help you out! Then I can introduce you to our family :grin:\n\nI know Discord can be a lot to take in at first, trust me, but it's really quite a wonderful place.`
        );
      });
      if (roleToAssign.name === "I'm from Australia!") {
        ghostPing(pMessage, "Australia");
      }
      if (roleToAssign.name === "I'm from the USA!") {
        ghostPing(pMessage, "USA");
      }
      if (roleToAssign.name === "I'm from Canada!") {
        ghostPing(pMessage, "Canada");
      }
      if (roleToAssign.name === "I'm from the UK!") {
        ghostPing(pMessage, "UK");
      }
    }
  }
}

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
  const isOutlier = [
    "Australia",
    "United States",
    "United Kingdom",
    "Canada",
  ].find((each) => country.title.includes(each));

  const regionOverrides: { [key: string]: string } = {
    England: "I'm from the UK! (England)",
    Scotland: "I'm from the UK! (Scotland)",
  };

  switch (isOutlier) {
    case "Australia":
      return guild.roles.cache.find(
        (role) => role.name === "I'm from Australia!"
      );
    case "United Kingdom":
      return guild.roles.cache.find((role) => role.name === "I'm from the UK!");
    case "United States":
      return guild.roles.cache.find(
        (role) => role.name === "I'm from the USA!"
      );
    case "Canada":
      return guild.roles.cache.find((role) => role.name === "I'm from Canada!");

    default:
      return guild.roles.cache.find(
        (role) =>
          role.name === regionOverrides[country.name] ||
          (role.name.startsWith("I'm from") &&
            role.name.toLowerCase().endsWith(country.name.toLowerCase() + "!"))
      );
  }
};

export const ghostPing = async (message: Message, region: String) => {
  const ausRegionChannel = message.guild.channels.cache.find(
    (channel) => channel.name === "australia-regions"
  ) as TextChannel;

  const usaRegionChannel = message.guild.channels.cache.find(
    (channel) => channel.name === "usa-regions"
  ) as TextChannel;

  const caRegionChannel = message.guild.channels.cache.find(
    (channel) => channel.name === "canada-regions"
  ) as TextChannel;

  const ukRegionChannel = message.guild.channels.cache.find(
    (channel) => channel.name === "uk-regions"
  ) as TextChannel;

  if (region === "Australia") {
    const ping = await ausRegionChannel.send(`<@${message.member}>`);
    await ping.delete();
  }

  if (region === "USA") {
    const ping = await usaRegionChannel.send(`<@${message.member}>`);
    await ping.delete();
  }

  if (region === "Canada") {
    const ping = await caRegionChannel.send(`<@${message.member}>`);
    await ping.delete();
  }

  if (region === "UK") {
    const ping = await ukRegionChannel.send(`<@${message.member}>`);
    await ping.delete();
  }
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
  const findGeneralRole = (member: GuildMember | PartialGuildMember) =>
    member.roles.cache.find(({ name }) => {
      return regionCountries.some((country) => name.endsWith(`${country}!`));
    });
  const hasSpecificRole = (member: GuildMember | PartialGuildMember) =>
    member.roles.cache.some(({ name }) => {
      return regionCountries.some((country) => name.includes(`${country}! (`));
    });

  const generalRole = findGeneralRole(oldMember);
  if (generalRole && hasSpecificRole(newMember)) {
    await newMember.roles.remove(generalRole);
    const hasNoOtherCountry =
      oldMember.roles.cache.filter(({ name }) => name.startsWith("I'm from"))
        .size === 1;

    if (hasNoOtherCountry) {
      await welcomeMember(oldMember.user, oldMember.guild);
    }
  }
};
