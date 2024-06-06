import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../../event-distribution/index.js";
import { ButtonInteraction, ThreadChannel } from "discord.js";
import { ChatNames } from "../../../collections/chat-names.js";

export const rescueCloseButtonId = "buddy-project-rescue-close";

@Command({
  event: DiscordEvent.BUTTON_CLICKED,
  customId: rescueCloseButtonId,
  parentNames: [ChatNames.BUDDY_PROJECT_INFO],
})
class RescueClose extends CommandHandler<DiscordEvent.BUTTON_CLICKED> {
  async handle(interaction: ButtonInteraction): Promise<void> {
    const { user, channel } = interaction;

    if (user.bot) return;

    if (!(channel instanceof ThreadChannel)) return;

    if (!channel.name.endsWith(`(${user.id})`)) {
      await channel.send(
        `${user}, only the creator of the thread may close it prematurely.`
      );
      return;
    }

    await channel.delete();
  }
}
