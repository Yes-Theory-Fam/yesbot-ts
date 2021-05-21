import { Guild, Message, Role, TextChannel, User } from "discord.js";
import { isRegistered, textLog } from "../common/moderator";
import { Country, countries } from "../collections/flagEmojis";
import { Unassigned } from ".";

export default async function WhereAreYouFromManager(pMessage: Message) {
  const newUser = !isRegistered(pMessage.member);

  if (newUser) {
    const matchedCountries = getCountriesFromMessage(pMessage.content);

    if (matchedCountries.length > 1) {
      pMessage.reply(
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
        textLog(
          `${moderatorRole.toString()}: <@${
            pMessage.author.id
          }> just requested role for country ${
            countryToAssign.name
          }, but I could not find it. Please make sure this role exists.`
        );
        return;
      }
      pMessage.member.roles.add(roleToAssign);
      pMessage.react("👍");
      pMessage.member.createDM().then((dmChannel) => {
        const rules = pMessage.guild.channels.cache.find(
          (c) => c.name === "rules"
        );
        const generalInfo = pMessage.guild.channels.cache.find(
          (c) => c.name === "general-info"
        );
        const welcomeChat = <TextChannel>(
          pMessage.guild.channels.cache.find((c) => c.name === "welcome-chat")
        );
        welcomeChat.send(getWelcomeMessage(pMessage.member.user));
        Unassigned.UnassignedMemberUpdate(pMessage.member);
        dmChannel.send(
          `Hey! My name is YesBot, I'm so happy to see you've made it into our world, we really hope you stick around!\n\nIn the meantime, you should checkout ${rules.toString()} and ${generalInfo.toString()} , they contain a lot of good-to-knows about our server and what cool stuff you can do.\nIf you'd like me to change your name on the server for you, just drop me a message and I will help you out! Then I can introduce you to our family :grin:\n\nI know Discord can be a lot to take in at first, trust me, but it's really quite a wonderful place.`
        );
      });
    }
  }
}

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
