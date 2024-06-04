import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
} from "discord.js";
import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../../event-distribution/index.js";
import { GetBalance } from "../usecase/get-balance.js";

@Command({
  event: DiscordEvent.SLASH_COMMAND,
  root: "yescoin",
  subCommand: "status",
  description: "Check the YesCoin balance of a user",
  options: [
    {
      name: "user",
      type: ApplicationCommandOptionType.User,
      description: "The user to check the balance of",
    },
  ],
})
export class AdminBalanceCheck
  implements CommandHandler<DiscordEvent.SLASH_COMMAND>
{
  public async handle(interaction: ChatInputCommandInteraction): Promise<void> {
    const user = interaction.options.getUser("user");
    const userId = user?.id ?? interaction.user.id;

    await GetBalance.instance()
      .handle(userId)
      .then((value) => {
        interaction.reply(
          `<@${userId}> currently has ${value}${
            interaction.client.emojis.cache.find(
              (value) => value.name === "yescoin"
            ) ?? " YesCoin"
          }`
        );
      });
  }
}
