import { Message } from "discord.js";
import { Command, DiscordEvent, CommandHandler } from "../../event-distribution";
import prisma from "../../prisma";

@Command({
    event: DiscordEvent.MESSAGE,
    trigger: "!group",
    subTrigger: "delete",
    allowedRoles: ["Support"],
    description: "This"
  })
  class DeleteGroup implements CommandHandler<DiscordEvent.MESSAGE> {
    async handle(message: Message): Promise<void> {
      const words = message.content.split(" ").slice(2)
      const requestedGroupName = words[0]
  
      if (!requestedGroupName) {
        await message.react("👎");
        return;
      }
    
      const group = await prisma.userGroup.findFirst({
        where: { name: requestedGroupName },
      });
    
      if (!group) {
        await message.reply("That group does not exist!");
        return;
      }
    
      await prisma.userGroup.delete({ where: { id: group.id } });
      await message.react("👍");
  
    }
  }