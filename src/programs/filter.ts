import { Message } from "discord.js";
import { Command, CommandHandler, DiscordEvent } from "../event-distribution";
import { hasRole, textLog } from "../common/moderator";
import Tools from "../common/tools";

@Command({
  event: DiscordEvent.MESSAGE,
  description: "This handler is to filter certain messages on the server.",
})
class Filter implements CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message): Promise<void> {
    const messageContent = message.content;
    const mentionedMembers = message.mentions.users.size;
    const member = message.member;

    if (mentionedMembers > 20 && !message.author.bot) {
      if (
        !(
          hasRole(member, "Support") ||
          hasRole(member, "Yes Theory") ||
          hasRole(member, "Seek Discomfort")
        )
      ) {
        await member.createDM().then(async (dm) => {
          await dm.send(
            "Hey there! You tagged more than 20 people in a single message. The message has been deleted and you have beeen timed out. Here is the message sent: "
          );
          await dm.send(messageContent);
        });
        await message.delete();
        const supportRole = Tools.getRoleByName(
          process.env.MODERATOR_ROLE_NAME,
          message.guild
        );
        const timeoutRole = Tools.getRoleByName("Time Out", message.guild);
        await message.member.roles.add(timeoutRole);
        await textLog(
          `<@&${supportRole.id}>: <@${message.author.id}> just tagged more than 20 people in a single message in <#${message.channel.id}>. The message has been deleted and they have beeen timed out.`
        ).then(() => textLog(`Message content was: ${messageContent}`));
      }
      return;
    }

    if (messageContent.match(/(nigga|nigger)/i)) {
      await message.delete();
      await member
        .createDM()
        .then((dm) =>
          dm.send(
            `Usage of the N word is absolutely banned within this server. Please refer to the <#450102410262609943>.`
          )
        );
    }
  }
}
