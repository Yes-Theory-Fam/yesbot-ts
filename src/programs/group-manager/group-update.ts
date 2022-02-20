import { Message } from "discord.js";
import { Command, DiscordEvent, CommandHandler } from "../../event-distribution";
import prisma from "../../prisma";

@Command({
    event: DiscordEvent.MESSAGE,
    trigger: "!group",
    subTrigger: "update",
    allowedRoles: ["Support"],
    description: "This"
  })
  class UpdateGroup implements CommandHandler<DiscordEvent.MESSAGE> {
    async handle(message: Message): Promise<void> {
      const words = message.content.split(" ").slice(2);
      const [requestedGroupName, ...rest] = words
      const description = rest.join(" ")
  
      if (!requestedGroupName) {
        await message.react("👎");
        return;
      }
    
      const group = await prisma.userGroup.findFirst({
        where: {
          name: {
            equals: requestedGroupName,
            mode: "insensitive",
          },
        },
      });
    
      if (!group) {
        await message.reply("That group doesn't exist!");
        return;
      }
    
      const previousDescription = group.description;
    
      await prisma.userGroup.update({
        where: { id: group.id },
        data: { description },
      });
    
      await message.reply(
        `Group description updated from \n> ${previousDescription} \nto \n> ${description}`
      );
  
    }
  }