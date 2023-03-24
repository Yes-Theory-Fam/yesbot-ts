import { Command, CommandHandler, DiscordEvent } from "../event-distribution";
import {
  ChannelType,
  ChatInputCommandInteraction,
  TextChannel,
} from "discord.js";
import { ApplicationCommandOptionType } from "discord.js";

@Command({
  event: DiscordEvent.SLASH_COMMAND,
  root: "shoutout-perms",
  description: "Manage who can post in the #shoutout channel!",
  subCommand: "allow",
  options: [
    {
      name: "user",
      type: ApplicationCommandOptionType.User,
      description: "The user to give permissions to",
      required: true,
    },
  ],
})
class ApproveShoutoutCommand
  implements CommandHandler<DiscordEvent.SLASH_COMMAND>
{
  async handle(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild) return;
    const channelName = "shoutouts";

    // Get handle of the user
    const user = interaction.options.getUser("user");
    if (user === null) {
      await interaction.reply({
        content: "Couldn't find member!",
        ephemeral: true,
      });
      return;
    }

    // Get the shoutouts channel
    const shoutouts = interaction.guild.channels.cache
      .filter((c) => c.isTextBased() && (c as TextChannel).name === channelName)
      .first();

    // there must be a way to type this in a more typescript-ish way
    if (shoutouts === null || shoutouts?.type !== ChannelType.GuildText) {
      await interaction.reply({
        content: "Couldn't find the #shoutouts channel!",
        ephemeral: true,
      });
      return;
    }

    // Give the user the permission to send messages and notify sender
    await shoutouts.permissionOverwrites.edit(user.id, {
      SendMessages: true,
    });
    await interaction.reply({
      content: "Successfully gave the permission!",
      ephemeral: true,
    });
  }
}

@Command({
  event: DiscordEvent.SLASH_COMMAND,
  root: "shoutout-perms",
  description: "Manage who can post in the #shoutout channel!",
  subCommand: "remove",
  options: [
    {
      name: "user",
      type: ApplicationCommandOptionType.User,
      description: "The user to remove shoutout permissions from",
      required: true,
    },
  ],
})
class RemoveShoutoutCommand
  implements CommandHandler<DiscordEvent.SLASH_COMMAND>
{
  async handle(interaction: ChatInputCommandInteraction): Promise<void> {
    // TODO: Finish this
  }
}
