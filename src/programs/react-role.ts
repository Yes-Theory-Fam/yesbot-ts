import { Message, MessageEmbed, Snowflake } from "discord.js";
import Tools from "../common/tools";
import { isAuthorModerator } from "../common/moderator";
import { createYesBotLogger } from "../log";
import prisma from "../prisma";

const logger = createYesBotLogger("program", "ReactRole");

const reactRole = async (message: Message) => {
  //! This comes to us in the format of "!roles [add|list] [messageId] [emoji] [roleId] [channelId]"
  //! So first we need to establish if it is add or list
  if (!isAuthorModerator(message)) return;

  const words = Tools.stringToWords(message.content);
  words.shift();
  const [action, messageId, reaction, roleId, channelId] = words;

  if (!action || !["add", "list", "delete", "search"].includes(action)) {
    await message.reply(
      `Incorrect syntax, please use the following: \`!role add|list|delete|search\``
    );
    return;
  }
  switch (action) {
    case "add":
      if (!messageId || !reaction || !roleId) {
        await message.reply(
          `Incorrect syntax, please use the following: \`!role add messageId reaction roleId <channelId>\``
        );
        return;
      }
      await addReactRoleObject(messageId, reaction, roleId, channelId, message);
      break;
    case "list":
      await listReactRoleObjects(message);
      break;
    case "delete":
      await deleteReactRoleObjects(Number(words[1]), message);
      break;
    case "search":
      await searchForRole([...words.slice(1)].join(" "), message);
      break;
    default:
      break;
  }
};

const searchForRole = async (roleSearchString: string, message: Message) => {
  let foundRole = Tools.getRoleByName(roleSearchString, message.guild);
  if (!foundRole) {
    foundRole = message.guild.roles.cache.find((role) =>
      role.name.toLowerCase().includes(roleSearchString.toLowerCase())
    );
  }
  if (!foundRole) {
    await message.reply("I couldn't find that role!");
  } else {
    await message.reply(
      `There are ${foundRole.members.size} members in ${foundRole.toString()}`
    );
  }
};

async function addReactRoleObject(
  messageId: Snowflake,
  reaction: string,
  roleId: Snowflake,
  channelId: Snowflake,
  pMessage: Message
) {
  if (roleId.startsWith("<")) roleId = roleId.substring(3, 21);

  let [message, channel] = await Tools.getMessageById(
    messageId,
    pMessage.guild,
    channelId
  );
  let role = await Tools.getRoleById(roleId, pMessage.guild);
  if (message && channel) {
    const reactRoleObject = {
      messageId: message.id,
      channelId: channelId,
      roleId: roleId,
      reaction,
    };
    try {
      await prisma.reactionRole.create({ data: reactRoleObject });
    } catch (err) {
      await pMessage.reply(
        `Failed to create reaction role. Error message: ${err}`
      );
      return;
    }
    await message.react(reaction);
    const successEmbed = new MessageEmbed()
      .setColor("#ff6063")
      .setTitle("Reaction role successfully added.")
      .addField("\u200b", "\u200b")
      .addField("Target Message:", message.cleanContent, true)
      .addField("Target Channel:", channel, true)
      .addField("Necessary Reaction:", reaction, true)
      .addField("Reward Role:", role, true);
    await pMessage.channel.send(successEmbed);
  } else {
    await pMessage.reply(
      "I couldn't find that message, please check the parameters of your `!roles add` and try again."
    );
  }
}

async function listReactRoleObjects(pMessage: Message) {
  const guild = pMessage.guild;
  const reactRoleObjects = await prisma.reactionRole.findMany({
    orderBy: { id: "asc" },
  });

  // Quick fix for limiting the results.
  let start = 0;
  let end = 5;
  const words = pMessage.content.split(" ");
  if (words.length >= 3) {
    start = parseInt(words[2]);
    if (isNaN(start)) {
      await pMessage.reply(`Hey! '${words[2]}' isn't a number!`);
      return;
    }
  }

  if (words.length >= 4) {
    end = parseInt(words[3]);
    if (isNaN(start)) {
      await pMessage.reply(`Hey! '${words[3]}' isn't a number!`);
      return;
    }
  }

  end = end <= start ? start + 5 : end;

  // Maybe this limits us to the last few items so we don't go out of bounds :)
  start = reactRoleObjects.length > start ? start : reactRoleObjects.length - 1;
  end = reactRoleObjects.length > end ? end : reactRoleObjects.length;

  let returnString = `**List of available role reactions (use !role list [start] [end] to limit) - Limit: ${start} - ${end}**:\n\n`;
  try {
    await Promise.all(
      reactRoleObjects.slice(start, end).map(async (reactionRoleObject) => {
        let role = guild.roles.cache.find(
          (r) => r.id == reactionRoleObject.roleId
        );
        let [message, channel] = await Tools.getMessageById(
          reactionRoleObject.messageId,
          guild,
          reactionRoleObject.channelId
        );
        returnString += `__**${reactionRoleObject.id}:**__\n**Message**: ${message?.cleanContent}\n`;
        returnString += `**Channel**: <#${channel}>\n`;
        returnString += `**Reaction**: ${reactionRoleObject.reaction}\n`;
        returnString += `**Reward Role**: <@&${role}>\n`;
        returnString += `\n`;
      })
    );
    await pMessage.channel.send(returnString);
  } catch (error) {
    await pMessage.channel.send(
      `I couldn't find any reaction roles for this server. Error message: ${error}`
    );
  }
}

async function deleteReactRoleObjects(index: number, pMessage: Message) {
  const objectToRemove = await prisma.reactionRole.findUnique({
    where: { id: index },
  });

  if (objectToRemove) {
    try {
      await prisma.reactionRole.delete({ where: { id: index } });
    } catch (err) {
      await pMessage.channel.send(
        `Failed to delete reaction role. Error message: ${err}`
      );
      return;
    }
    let [message] = await Tools.getMessageById(
      objectToRemove.messageId,
      pMessage.guild,
      objectToRemove.channelId
    );
    try {
      await message.reactions.removeAll();
    } catch (err) {
      // We don't really care about the error, since the message/channel might have been removed.
      // We log it for good measure.
      logger.error(
        "Error while removing all reactions from a reactionRole message",
        err
      );
    }
    await pMessage.channel.send("Successfully removed reaction role.");
  } else {
    await pMessage.reply("I cannot find a role with that ID.");
  }
}

export default reactRole;
