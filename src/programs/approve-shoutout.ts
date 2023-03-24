import { Command, CommandHandler, DiscordEvent } from "../event-distribution";
import {
  ChannelType,
  ChatInputCommandInteraction,
  OverwriteType,
  PermissionOverwrites,
  TextChannel,
} from "discord.js";
import { ApplicationCommandOptionType } from "discord.js";

@Command({
  event: DiscordEvent.SLASH_COMMAND,
  root: "shoutout-perms",
  description: "Manage who can post in the #shoutout channel!",
  subCommand: "toggle",
  options: [
    {
      name: "user",
      type: ApplicationCommandOptionType.User,
      description: "The user to give permissions to",
      required: true,
    },
  ],
})
class ShoutoutPermsToggleCommand
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

    const permOverwrite = shoutouts.permissionOverwrites.cache.filter(
      c => c.type === OverwriteType.Member && c.id === user.id).first();

    // If there is an existing perm overwrite, remove it
    if (permOverwrite) {
      await permOverwrite.delete();
      await interaction.reply({
        content: "Removed the permission!",
        ephemeral: true,
      });

      return;
    }

    // Otherwise, add it
    await shoutouts.permissionOverwrites.edit(user.id, {
      SendMessages: true
    });
    await interaction.reply({
      content: "Successfully gave the permission!",
      ephemeral: true,
    });
  }
}
