import { Command, CommandHandler, DiscordEvent } from "../event-distribution";
import {
  ChannelType,
  ChatInputCommandInteraction,
  OverwriteType,
  TextChannel,
  ApplicationCommandOptionType,
  Message,
  User,
} from "discord.js";
import bot from "..";
import { ChatNames } from "../collections/chat-names";

const getSendPerms = (channel: TextChannel, user: User) => {
  return channel.permissionOverwrites.cache
    .filter((c) => c.type === OverwriteType.Member && c.id === user.id)
    .first();
};

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
    const channel = interaction.channel;

    if (channel?.type !== ChannelType.GuildText) return;
    if (!channel.name.startsWith("shoutout-")) {
      await interaction.reply({
        content: "Can not send this here!",
        ephemeral: true,
      });
      return;
    }

    // Get handle of the user
    const user = interaction.options.getUser("user");
    if (user === null) {
      await interaction.reply({
        content: "Couldn't find the member!",
        ephemeral: true,
      });
      return;
    }

    // Get the shoutouts channel
    const shoutouts = interaction.guild.channels.cache
      .filter(
        (c) =>
          c.isTextBased() && (c as TextChannel).name === ChatNames.SHOUTOUTS
      )
      .first();

    // there must be a way to type this in a more typescript-ish way
    if (shoutouts === null || shoutouts?.type !== ChannelType.GuildText) {
      await interaction.reply({
        content: `Couldn't find the <#${ChatNames.SHOUTOUTS}> channel!`,
        ephemeral: true,
      });
      return;
    }

    // If there is an existing perm overwrite, remove it
    const sendPerms = getSendPerms(shoutouts, user);
    if (sendPerms && getSendPerms(shoutouts, user)) {
      await sendPerms.delete();
      await interaction.reply({
        content: "Removed the permission!",
        ephemeral: true,
      });
      return;
    }

    // Otherwise, add it
    await shoutouts.permissionOverwrites.edit(user.id, {
      SendMessages: true,
    });
    await interaction.reply({
      content: "Successfully gave the permission!",
      ephemeral: true,
    });
    await channel.send({
      content: `Hey <@${user.id}>, feel free to send a message on the <#${shoutouts.id}> channel!`,
    });
  }
}

@Command({
  event: DiscordEvent.MESSAGE,
  description:
    "This handler removes the user's permission to send messages in the shoutout channel once used",
  channelNames: [ChatNames.SHOUTOUTS],
})
class ShoutoutMessageHandlerCommand
  implements CommandHandler<DiscordEvent.MESSAGE>
{
  async handle(message: Message): Promise<void> {
    const sender = message.member?.user;
    const channel = message.channel;

    if (!sender || !channel) return;
    if (sender.id === bot.user?.id) return;
    if (channel.type !== ChannelType.GuildText) return;

    const sendPerms = getSendPerms(channel, sender);

    if (sendPerms) {
      await sendPerms.delete();
    }
  }
}
