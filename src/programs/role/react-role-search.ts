import { Message } from "discord.js";
import Tools from "../../common/tools";
import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../event-distribution";

@Command({
  event: DiscordEvent.MESSAGE,
  trigger: "!role",
  subTrigger: "search",
  allowedRoles: ["Support"],
  description: "This",
})
class SearchForRole implements CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message): Promise<void> {
    const words = message.content.split(/\s+/);
    const roleSearchString = words.splice(2).join(" ");
    if (!roleSearchString) {
      await Tools.handleUserError(message, "You must write a role name.");
      return;
    }
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
  }
}
