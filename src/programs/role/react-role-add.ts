import { Message, MessageEmbed, TextChannel } from "discord.js";
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
  description: "This",
})
class AddReactRoleObject implements CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message): Promise<void> {
    if (!message.reference) {
      await Tools.handleUserError(
        message,
        "You must reply to the message you want to use this command on!"
      );
      return;
    }

    const referencedMessageId = message.reference.messageID;
    const channelId = message.reference.channelID;
    const channel = bot.channels.resolve(channelId) as TextChannel;
    const referencedMessage = await channel.messages.fetch(referencedMessageId);
    let [, , reaction, roleId] = message.content.split(" ");

    if (!reaction || !roleId) {
      await Tools.handleUserError(
        message,
        `Incorrect syntax, please use the following: \`!role add reaction roleId\``
      );
      return;
    }

    if (roleId.startsWith("<")) roleId = roleId.substring(3, 21);

    let role = await Tools.getRoleById(roleId, message.guild);

    if (referencedMessage && channel) {
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
        .addField("Target Channel:", channel, true)
        .addField("Necessary Reaction:", reaction, true)
        .addField("Reward Role:", role, true);
      await textLog(successEmbed);
      await message.delete();
    }
  }
}
