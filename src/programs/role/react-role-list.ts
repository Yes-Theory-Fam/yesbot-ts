import { Message } from "discord.js";
import Tools from "../../common/tools";
import prisma from "../../prisma";
import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../event-distribution";
import { createYesBotLogger } from "../../log";

const logger = createYesBotLogger("programs", "role-list");

@Command({
  event: DiscordEvent.MESSAGE,
  trigger: "!role",
  subTrigger: "list",
  allowedRoles: ["Support"],
  description: "This",
})
class ListReactRoleObjects implements CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message): Promise<void> {
    const guild = message.guild;
    if (!guild) return;

    const reactRoleObjects = await prisma.reactionRole.findMany({
      orderBy: { id: "asc" },
    });

    let start = 0;
    let end = 5;
    const words = message.content.split(" ");
    if (words.length >= 3) {
      start = parseInt(words[2]);
      if (isNaN(start)) {
        await message.reply(`Hey! '${words[2]}' isn't a number!`);
        return;
      }
    }

    if (words.length >= 4) {
      end = parseInt(words[3]);
      if (isNaN(start)) {
        await message.reply(`Hey! '${words[3]}' isn't a number!`);
        return;
      }
    }

    end = end <= start ? start + 5 : end;

    // Maybe this limits us to the last few items so we don't go out of bounds :)
    start =
      reactRoleObjects.length > start ? start : reactRoleObjects.length - 1;
    end = reactRoleObjects.length > end ? end : reactRoleObjects.length;

    let returnString = `**List of available role reactions (use !role list [start] [end] to limit) - Limit: ${start} - ${end}**:\n\n`;
    try {
      await Promise.all(
        reactRoleObjects.slice(start, end).map(async (reactionRoleObject) => {
          const role = guild?.roles.cache.find(
            (r) => r.id == reactionRoleObject.roleId
          );

          const messageDetails = await Tools.getMessageById(
            reactionRoleObject.messageId,
            guild,
            reactionRoleObject.channelId
          );

          if (!messageDetails) return;

          const [message, channel] = messageDetails;

          returnString += `__**${reactionRoleObject.id}:**__\n**Message**: ${message?.cleanContent}\n`;
          returnString += `**Channel**: ${channel}\n`;
          returnString += `**Reaction**: ${reactionRoleObject.reaction}\n`;
          returnString += `**Reward Role**: ${role}\n`;
          returnString += `\n`;
        })
      );
      await message.channel.send(returnString);
    } catch (error) {
      await message.channel.send(
        `I couldn't find any reaction roles for this server.`
      );
      logger.error(
        "I Couldn't find any reaction roles for this server: ",
        error
      );
    }
  }
}
