import Discord, {
  Snowflake,
  TextChannel,
  GuildMember,
  Message,
  MessageEmbed,
} from "discord.js";
import Tools from "../common/tools";
import { UserGroupRepository } from "../entities/UserGroup";
import { formatBirthday, getUserBirthday } from "./BirthdayManager";
import { FamilyRepository } from "../entities/Family";

interface FamilyManager {
  partnerOne: String;
  partnerTwo: String;
  child: String;
  parent: String;
}

export default async function FamilyManager(pMessage: Discord.Message) {
  const { content } = pMessage;
  pMessage.channel.send("Message received: " + content);
  const yesEmoji = pMessage.member.guild.emojis.cache.find(
    (e) => e.name == "yes_yf"
  );

  if (content.includes("propose")) {
    const words = Tools.stringToWords(content);
    words.shift();
    pMessage.channel.send(words);

    let requestedUser = pMessage.mentions.users.first();
    if (!requestedUser) {
      requestedUser = pMessage.member.user;
    }

    const requestedMember = pMessage.guild.members.cache.find(
      (m) => m.user === requestedUser
    );

    if (!requestedMember) {
      pMessage.reply("I couldn't find that member in this server!");
      return;
    }

    const family = await getFamilyTree(requestedMember.id);
    if (family === null || family?.partner === null) {
      console.log("Marrying two people!");
      marryPerson(pMessage.member.user.id, requestedUser.id).then(() =>
        pMessage.channel.send(
          `Congratulations! You are now married to <@${requestedUser.id}>!! :tada:`
        )
      );
    } else {
      pMessage.channel.send(
        `Hmm there was an error, you can not marry <@${pMessage.member.user.id}> at the moment! :sad:`
      );
    }

    return;
  }

  if (content.includes("tree")) {
    const msgEmbed = await sendFamilyTree(
      pMessage.member.user.id,
      pMessage.member.user,
      pMessage.member
    );
    pMessage.channel.send(msgEmbed);
    return;
  }

  if (content.includes("adopt")) {
    const result = await getFamilyTree(pMessage.member.id);
    if (result && result.child == null) {
      let requestedUser = pMessage.mentions.users.first();
      if (!requestedUser) {
        pMessage.channel.send(
          "Please specify who you want to adopt as your child!"
        );
        return;
      }

      const adoptionResult = await adoptChild(
        pMessage.member.user.id,
        requestedUser.id
      );
      if (adoptionResult) {
        pMessage.channel.send(
          `Congratulations on adopting <@${adoptionResult.child}>!! :baby: :tada:`
        );
        return;
      }
    } else {
      pMessage.channel.send(
        `You already have a child: <@${result.child}> :eyes: :thinking:. If you want to adopt another child, please let this one go :( `
      );
      return;
    }
  }
}

async function getFamilyTree(id: string, partnerSearch: boolean = false) {
  const famRepo = await FamilyRepository();
  const result = await famRepo.findOne({
    where: {
      userid: id,
    },
  });

  if (result == undefined) {
    console.log("User is not in the family database!");
    return null;
  }

  if (!partnerSearch) {
    const pResult = await getFamilyTree(result.partner, true);
    if (pResult.partner !== null) {
      return null;
    }
  }

  return result;
}

async function sendFamilyTree(
  id: string,
  user: Discord.User,
  member: Discord.GuildMember
) {
  const family = await getFamilyTree(id);

  if (family) {
    const msgEmbed = new MessageEmbed();

    msgEmbed.setThumbnail(user.avatarURL());
    msgEmbed.setTitle(member.user.username + "#" + member.user.discriminator);
    msgEmbed.setColor(member.roles.color.color);
    msgEmbed.addField("Hi! My name is:", user.username, true);
    msgEmbed.addField("\u200b", "\u200b");

    if (family.partner) {
      msgEmbed.addField(
        "I am married to ",
        `<@${family.partner}> :ring:`,
        true
      );
    }

    if (family.child) {
      msgEmbed.addField("My child is :baby:", `<@${family.child}>`, true);
    }
    if (family.mom) {
      msgEmbed.addField("My Mom is ", ` <@${family.mom}>`, true);
    }
    if (family.dad) {
      msgEmbed.addField("My Dad is", `<@${family.dad}>`, true);
    }
    msgEmbed.setFooter(
      "Thank you for using the Yes Theory Fam Discord Server!"
    );

    return msgEmbed;
  }
}

async function marryPerson(partnerOne: string, partnerTwo: string) {
  const famRepo = await FamilyRepository();
  const result = famRepo.create({
    userid: partnerOne,
    partner: partnerTwo,
    marriageDate: new Date(),
  });

  const pResult = famRepo.create({
    userid: partnerTwo,
    partner: partnerOne,
    marriageDate: new Date(),
  });

  return await famRepo.save([result, pResult]);
}

async function adoptChild(adopter: string, adoptedChild: string) {
  const famRepo = await FamilyRepository();
  const res = famRepo.create({
    userid: adopter,
    child: adoptedChild,
  });

  return await famRepo.save(res);
}
