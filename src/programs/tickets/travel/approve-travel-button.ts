import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../../event-distribution";
import {
  ThreadAutoArchiveDuration,
  ButtonInteraction,
  TextChannel,
} from "discord.js";
import { ChatNames } from "../../../collections/chat-names";
import { TravelDataMessageConverter } from "./travel-data-message-converter";

@Command({
  event: DiscordEvent.BUTTON_CLICKED,
  customId: "travel-approve",
})
class ApproveTravelButton extends CommandHandler<DiscordEvent.BUTTON_CLICKED> {
  async handle(interaction: ButtonInteraction): Promise<void> {
    const message = interaction.message;
    const guild = interaction.guild!;

    const details = TravelDataMessageConverter.fromMessage(message, guild);

    const member = guild.members.resolve(interaction.user.id);
    if (!member) throw new Error("Could not resolve approving member!");

    const approver = member.displayName;
    const newContent =
      message.content +
      `

Approved by ${approver}`;
    // Remove buttons as early as possible before someone else votes as well
    await message.edit({ content: newContent, components: [] });

    const travelChannel = interaction.guild?.channels.cache.find(
      (c): c is TextChannel => c.name === ChatNames.TRAVELING_TOGETHER
    );
    if (!travelChannel) throw new Error("Could not find travel channel!");

    const messageWithMentions = TravelDataMessageConverter.toMessage(
      details,
      true
    );

    const travelPost =
      messageWithMentions +
      "\n\nClick on the thread right below this line if you're interested to join the chat and talk about it 🙂";
    const travelMessage = await travelChannel?.send(travelPost);

    const ticketMember = await guild.members.fetch(details.userId);
    const threadName = `${ticketMember.displayName} in ${details.places}`;
    const trimmedThreadname = threadName.substring(0, 100);

    await travelMessage.startThread({
      name: trimmedThreadname,
      autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
    });
  }
}
