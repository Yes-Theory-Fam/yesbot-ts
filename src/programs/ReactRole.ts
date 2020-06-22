import Discord, { Snowflake, TextChannel, Message } from "discord.js";
import Tools from "../common/tools";
import { MODERATOR_ROLE_NAME } from "../const";
import { isAuthorModerator } from "../common/moderator";
import { ReactionRoleRepository } from "../entities/ReactionRole";

export default async function ReactRole(message: Discord.Message) {
  //! This comes to us in the format of "!roles [add|list] [messageId] [emoji] [roleId] [channelId]"
  //! So first we need to establish if it is add or list
  if (!isAuthorModerator(message)) return;

  const words = Tools.stringToWords(message.content);
  words.shift();
  const [action, messageId, reaction, roleId, channelId] = words;
  const workingChannel: Discord.Channel = channelId
    ? message.guild.channels.resolve(channelId)
    : message.channel;

  if (!action || !["add", "list", "delete", "search"].includes(action)) {
    message.reply(
      `Incorrect syntax, please use the following: \`!roles add|list|delete\``
    );
    return;
  }
  switch (action) {
    case "add":
      if (!messageId || !reaction || !roleId || !message) {
        message.reply(
          `Incorrect syntax, please use the following: \`!roles add messageId reaction roleId <channelId>\``
        );
        return;
      }
      addReactRoleObject(messageId, reaction, roleId, channelId, message);
      break;
    case "list":
      listReactRoleObjects(message);
      break;
    case "delete":
      deleteReactRoleObjects(words[1], message);
      break;
    case "search":
      searchForRole(words[1], message);
      break;
    default:
      break;
  }
}

const searchForRole = async (roleSearchString: string, message: Message) => {
  const foundRole = message.guild.roles.cache.find((role) =>
    role.name.toLowerCase().includes(roleSearchString.toLowerCase())
  );
  if (!foundRole) {
    message.reply("I couldn't find that role!");
  } else {
    message.reply(
      `There are ${foundRole.members.size} members in ${foundRole.toString()}`
    );
  }
};

async function addReactRoleObject(
  messageId: Snowflake,
  reaction: string,
  roleId: Snowflake,
  channelId: Snowflake,
  pMessage: Discord.Message
) {
  if (roleId.startsWith("<")) roleId = roleId.substring(3, 21);

  let [message, channel] = await Tools.getMessageById(
    messageId,
    pMessage.guild,
    channelId
  );
  let role = await Tools.getRoleById(roleId, pMessage.guild);
  message = <Discord.Message>message;
  if (message && channel) {
    const reactionRoleRepository = await ReactionRoleRepository();
    const reactRoleObject = reactionRoleRepository.create({
      messageId: message.id,
      channelId: channelId,
      roleId: roleId,
      reaction,
    });
    try {
      await reactionRoleRepository.save(reactRoleObject);
    } catch (err) {
      pMessage.reply(`Failed to create reaction role. Error message: ${err}`);
      return;
    }
    await message.react(reaction);
    const successEmbed = new Discord.MessageEmbed()
      .setColor("#ff6063")
      .setTitle("Reaction role successfully added.")
      .addField("\u200b", "\u200b")
      .addField("Target Message:", message.cleanContent, true)
      .addField("Target Channel:", channel, true)
      .addField("Necessary Reaction:", reaction, true)
      .addField("Reward Role:", role, true);
    pMessage.channel.send(successEmbed);
  } else {
    pMessage.reply(
      "I couldn't find that message, please check the parameters of your `!roles add` and try again."
    );
  }
}

async function listReactRoleObjects(pMessage: Discord.Message) {
  const guild = pMessage.guild;
  const reactionRoleRepository = await ReactionRoleRepository();
  const reactRoleObjects = await reactionRoleRepository.find({
    order: { id: "ASC" },
  });
  console.log("listing");

  // Quick fix for limiting the results.
  let start = 0;
  let end = 5;
  const words = pMessage.content.split(" ");
  if (words.length >= 3) {
    start = parseInt(words[2]);
    if (isNaN(start)) {
      pMessage.reply(`Hey! '${words[2]}' isn't a number!`);
      return;
    }
  }

  if (words.length >= 4) {
    end = parseInt(words[3]);
    if (isNaN(start)) {
      pMessage.reply(`Hey! '${words[3]}' isn't a number!`);
      return;
    }
  }

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
        message = <Discord.Message>message;
        returnString += `__**${reactionRoleObject.id}:**__\n**Message**: ${message?.cleanContent}\n`;
        returnString += `**Channel**: <#${channel}>\n`;
        returnString += `**Reaction**: ${reactionRoleObject.reaction}\n`;
        returnString += `**Reward Role**: <@&${role}>\n`;
        returnString += `\n`;
      })
    );
    pMessage.channel.send(returnString);
  } catch (error) {
    pMessage.channel.send(
      `I couldn't find any reaction roles for this server. Error message: ${error}`
    );
  }
}

async function deleteReactRoleObjects(index: any, pMessage: Discord.Message) {
  const reactionRoleRepository = await ReactionRoleRepository();
  const objectToRemove = await reactionRoleRepository.findOne({
    where: {
      id: index,
    },
  });
  if (objectToRemove) {
    try {
      await reactionRoleRepository.delete(objectToRemove);
    } catch (err) {
      pMessage.channel.send(
        `Failed to delete reaction role. Error message: ${err}`
      );
      return;
    }
    let [message, _] = await Tools.getMessageById(
      objectToRemove.messageId,
      pMessage.guild,
      objectToRemove.channelId
    );
    message = <Discord.Message>message;
    message.reactions.removeAll();
    pMessage.channel.send("Successfully removed reaction role.");
  } else {
    pMessage.reply("I cannot find a role with that ID.");
  }
}
