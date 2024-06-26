import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../event-distribution/index.js";
import { MessageContextMenuCommandInteraction } from "discord.js";

const metaEmojiName = "eeeh";

const enum MetaErrors {
  SELF_META = "SELF_META",
  ALREADY_METAED = "ALREADY_METAED",
}

export const metaCommandCoverage = [0,0,0];

@Command({
  event: DiscordEvent.CONTEXT_MENU_MESSAGE,
  name: "Meta question",
  errors: {
    [MetaErrors.SELF_META]: "You cannot meta yourself!",
    [MetaErrors.ALREADY_METAED]:
      "This command was already used on this message!",
  },
})
export class MetaCommand implements CommandHandler<DiscordEvent.CONTEXT_MENU_MESSAGE> {
  async handle(command: MessageContextMenuCommandInteraction): Promise<void> {
    const message = command.targetMessage;

    if (command.user === message.author) {
      metaCommandCoverage[0] = 1;
      throw new Error(MetaErrors.SELF_META);
    }

    const emojiByName = (name: string) =>
      message.guild?.emojis.cache.find((e) => e.name === name);
    const metaEmoji = emojiByName(metaEmojiName);

    const didBotReact = message.reactions.cache.some((reaction) => reaction.me);
    if (didBotReact) {
      metaCommandCoverage[1] = 1;
      throw new Error(MetaErrors.ALREADY_METAED);
    }

    await message.reply({
      content:
        "https://user-images.githubusercontent.com/17064122/122255708-ae6e9680-cece-11eb-8c01-6f29a3995680.png",
    });
    await message.react(metaEmoji ?? "🦥");

    await command.reply({ ephemeral: true, content: "Done!" });

    metaCommandCoverage[2] = 1;
  }
}
