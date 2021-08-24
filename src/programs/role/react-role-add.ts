import { Channel, Message, MessageEmbed, TextChannel } from "discord.js";
import Tools from "../../common/tools";
import { textLog } from "../../common/moderator";
import prisma from "../../prisma";
import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../event-distribution";
import bot from "../..";
import { createYesBotLogger } from "../../log";

const logger = createYesBotLogger("programs", "role-add");

@Command({
  event: DiscordEvent.MESSAGE,
  trigger: "!role",
  subTrigger: "add",
  allowedRoles: ["Support"],
  description: "This handler is to add a reaction that can give a role",
})
class AddReactRoleObject implements CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message): Promise<void> {
    const [, , reaction, roleId, messageId, channelId] =
      message.content.split(" ");

    if (message.reference && reaction && roleId) {
      const referencedMessageId = message.reference.messageId;
      const channelId = message.reference.channelId;
      const channel = bot.channels.resolve(channelId) as TextChannel;
      const referencedMessage = await channel.messages.fetch(
        referencedMessageId
      );

      await addReactRoleObject(
        message,
        channel,
        reaction,
        roleId,
        referencedMessage
      );
      return;
    }

    if (!reaction || !roleId || !messageId || !channelId) {
      await Tools.handleUserError(
        message,
        `Incorrect syntax, if using option of replying, please reply to the requested message with only the roleId and reaction, if not replying the messageId and channelId is needed. \`!role add reaction roleId messageId channelId\``
      );
      return;
    }

    const [requestedMessage, requestedChannel] = await Tools.getMessageById(
      messageId,
      message.guild,
      channelId
    );

    await addReactRoleObject(
      message,
      requestedChannel,
      reaction,
      roleId,
      requestedMessage
    );
  }
}

const addReactRoleObject = async (
  message: Message,
  channel: Channel,
  reaction: string,
  roleId: string,
  referencedMessage: Message
) => {
  if (roleId.startsWith("<")) roleId = roleId.substring(3, 21);

  let role = await Tools.getRoleById(roleId, message.guild);

  if (!role) {
    await Tools.handleUserError(
      message,
      `I could not find the requested role please verify all information you put are correct! You can find your message in <#${process.env.OUTPUT_CHANNEL_ID}>.`
    );
    await textLog(`<@${message.author.id}>: ${message.toString()}`);
    return;
  }

  const referencedMessageId = referencedMessage.id;
  const channelId = channel.id;

  const reactRoleObject = {
    messageId: referencedMessageId,
    channelId: channelId,
    roleId: roleId,
    reaction,
  };
  try {
    await prisma.reactionRole.create({ data: reactRoleObject });
  } catch (err) {
    await Tools.handleUserError(message, "Failed to create react object");
    logger.error("Failed to create role object: ", err);
    return;
  }

  await referencedMessage.react(reaction);
  const successEmbed = new MessageEmbed()
    .setColor("#ff6063")
    .setTitle("Reaction role successfully added.")
    .addField("\u200b", "\u200b")
    .addField("Target Message:", message.cleanContent, true)
    .addField("Target Channel:", channel.toString(), true)
    .addField("Necessary Reaction:", reaction, true)
    .addField("Reward Role:", role.toString(), true);
  await textLog(successEmbed);
  await message.delete();
};
