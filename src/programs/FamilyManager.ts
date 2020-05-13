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
  const messageUser = pMessage.member.user;

  let requestedUser = pMessage.mentions.users.first();
  if (!requestedUser && !content.includes("tree")) {
    pMessage.channel.send("Please enter a user you want to interact with.");
    return;
  }

  if (content.includes("propose")) {
    const words = Tools.stringToWords(content);
    words.shift();
    pMessage.channel.send(words);

    const requestedMember = pMessage.guild.members.cache.find(
      (m) => m.user === requestedUser
    );

    if (!requestedMember) {
      pMessage.reply("I couldn't find that member in this server!");
      return;
    }

    const partnerFam = await getFamilyTree(requestedMember.id);
    const initialFamily = await getFamilyTree(messageUser.id);
    console.log(initialFamily);
    console.log(partnerFam);
    if (
      (initialFamily === null || initialFamily?.partner === null) &&
      (partnerFam === null || partnerFam?.partner === null)
    ) {
      console.log("Marrying two people!");
      marryPerson(messageUser.id, requestedUser.id).then(() =>
        pMessage.channel.send(
          `Congratulations! You are now married to <@${requestedUser.id}>!! :tada:`
        )
      );
    } else {
      pMessage.channel.send(
        `Hmm there was an error, you can not marry <@${messageUser.id}> at the moment! :sad:`
      );
    }

    return;
  }

  if (content.includes("tree")) {
    const msgEmbed = await sendFamilyTree(
      messageUser.id,
      messageUser,
      pMessage.member
    );
    pMessage.channel.send(msgEmbed);
    return;
  }

  if (content.includes("adopt")) {
    const result = await getFamilyTree(messageUser.id);
    if (result?.child == null) {
      if (!requestedUser) {
        pMessage.channel.send(
          "Please specify who you want to adopt as your child!"
        );
        return;
      }

      const childFam = await getFamilyTree(requestedUser.id);
      if (childFam.dad === null || childFam.mom === null) {
        const adoptionResult = await adoptChild(
          messageUser.id,
          requestedUser.id,
          childFam.mom ? "Dad" : "Mom"
        );
        if (adoptionResult) {
          pMessage.channel.send(
            `Congratulations on adopting <@${adoptionResult.child}>!! :baby: :tada:`
          );
          return;
        }
      }
    } else {
      pMessage.channel.send(
        `You already have a child: <@${result.child}> :eyes: :thinking:. If you want to adopt another child, please let this one go :( `
      );
      return;
    }
  }

  if (content.includes("bestfriend")) {
    const result = await getFamilyTree(pMessage.member.id, false);
    if (result?.bestfriend == null) {
      let requestedUser = pMessage.mentions.users.first();
      if (!requestedUser) {
        pMessage.channel.send(
          "Please mention who you want to be best-friends with!"
        );
      }
      await getNewBestFriend(messageUser.id, requestedUser.id);
      pMessage.channel.send(
        `Yay! :tada: You and <@${requestedUser.id}> are now best friends! :heart: `
      );
      return;
    }
  }
}

async function getFamilyTree(id: string, partnerSearch: boolean = false) {
  try {
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

    return result;
  } catch (err) {
    console.log("There was an error with getting family tree: ", err);
  }
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
    if (family.bestfriend) {
      msgEmbed.addField(
        "My Best Friend is",
        `<@${family.bestfriend}>! :heart:`,
        true
      );
    }
    msgEmbed.setFooter(
      "Thank you for using the Yes Theory Fam Discord Server!"
    );

    return msgEmbed;
  }
}

async function marryPerson(partnerOne: string, partnerTwo: string) {
  try {
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
  } catch (err) {
    console.log("Error with marrying a person: ", err);
  }
}

async function adoptChild(
  adopter: string,
  adoptedChild: string,
  roleToChild: string
) {
  try {
    const famRepo = await FamilyRepository();
    const res = famRepo.create({
      userid: adopter,
      child: adoptedChild,
    });

    const parentApplication =
      roleToChild === "Mom" ? { mom: adopter } : { dad: adopter };
    const childRes = famRepo.create({
      userid: adoptedChild,
      ...parentApplication,
    });

    return await famRepo.save([res, childRes]);
  } catch (err) {
    console.log("There was an error with adopting a child!: ", err);
  }
}

async function getNewBestFriend(id: string, bestFriendId: string) {
  try {
    const famRepo = await FamilyRepository();
    const res = famRepo.create({
      userid: id,
      bestfriend: bestFriendId,
    });

    const friendRes = famRepo.create({
      userid: bestFriendId,
      bestfriend: id,
    });

    return await famRepo.save([res, friendRes]);
  } catch (err) {
    // THere was an error with
    console.log("There was an error with Best Friend submission: ", err);
  }
}
