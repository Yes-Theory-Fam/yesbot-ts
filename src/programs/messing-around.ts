import { Command, CommandHandler, DiscordEvent } from "../event-distribution";
import { ChatNames } from "../collections/chat-names";
import {
  ButtonInteraction,
  Message,
  MessageActionRow,
  MessageButton,
} from "discord.js";
import { ButtonStyle, ComponentType } from "discord-api-types";

const messButton = "messButton";

@Command({
  event: DiscordEvent.MESSAGE,
  trigger: "!mess",
  description: "This makes a mess",
  channelNames: [ChatNames.PERMANENT_TESTING],
})
class MessCreatorCommand extends CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message): Promise<void> {
    const button = new MessageButton({
      custom_id: messButton,
      label: "Click me",
      style: ButtonStyle.Primary,
      type: ComponentType.Button,
    });

    const actionRow = new MessageActionRow({ components: [button] });
    await message.reply({
      components: [actionRow],
      content: "This is a button",
    });
  }
}

@Command({
  event: DiscordEvent.BUTTON_CLICKED,
  customId: messButton,
  channelNames: [ChatNames.PERMANENT_TESTING],
})
class MessCreatorButton extends CommandHandler<DiscordEvent.BUTTON_CLICKED> {
  async handle(interaction: ButtonInteraction) {
    await interaction.update({ components: [] });
  }
}
