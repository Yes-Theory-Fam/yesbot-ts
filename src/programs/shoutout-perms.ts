import { Command, CommandHandler, DiscordEvent } from "../event-distribution";
import {
  ChannelType,
  ChatInputCommandInteraction,
  Guild,
  Snowflake,
  OverwriteType,
  TextChannel,
  PermissionOverwrites,
  PermissionsBitField,
  Message,
  User,
} from "discord.js";
import bot from "..";
import { ChatNames } from "../collections/chat-names";
import { createYesBotLogger } from "../log";
import { Timer } from "@prisma/client";
import { TimerService } from "./timer/timer.service";

interface ShoutoutPermsData {
  channelId: Snowflake;
  userId: Snowflake;
}

const shoutoutPermsIdentifier = "shoutoutPermsRemove";

const getShoutoutsChannel = (guild: Guild) => {
  return guild.channels.cache
    .filter(
      (c) => c.isTextBased() && (c as TextChannel).name === ChatNames.SHOUTOUTS
    )
    .first();
};

@Command({
  event: DiscordEvent.SLASH_COMMAND,
  root: "shoutout-perms",
  description: "Manage who can post in the #shoutout channel!",
  subCommand: "toggle",
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
        content: "This command must be used in a shoutout ticket's channel!",
        ephemeral: true,
      });
      return;
    }

    // Get handle of the user
    const user = interaction.client.users.resolve(channel.name.split("-")[1]);
    if (user === null) {
      await interaction.reply({
        content: "Couldn't find the member!",
        ephemeral: true,
      });
      return;
    }

    // Get the shoutouts channel
    const shoutouts = getShoutoutsChannel(interaction.guild);
    if (shoutouts?.type !== ChannelType.GuildText) {
      await interaction.reply({
        content: `Couldn't find the <#${ChatNames.SHOUTOUTS}> channel!`,
        ephemeral: true,
      });
      return;
    }

    // Check whether there's an instance.
    // If there is an existing perm overwrite, remove it
    const perms = await shoutouts.permissionsFor(user);
    const hasSendPerms = perms?.has(PermissionsBitField.Flags.SendMessages, false) ?? false;

    if (hasSendPerms) {
      await channel.permissionOverwrites.delete(user);

      await interaction.reply({
        content: "Removed the permission!",
        ephemeral: true,
      });
      return;
    }

    // Otherwise, create a new one
    await shoutouts.permissionOverwrites.edit(user.id, {
      SendMessages: true,
    });
    await interaction.reply({
      content: "Successfully gave the permission!",
      ephemeral: true,
    });

    // Create the timer (runs in 1 day)
    const executeTime = new Date();
    executeTime.setDate(executeTime.getDate() + 1);
    const timerId = await TimerService.createTimer(
      shoutoutPermsIdentifier,
      executeTime,
      {
        channelId: shoutouts.id,
        userId: user.id,
      }
    );

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

    await channel.permissionOverwrites.delete(sender);
  }
}

@Command({
  event: DiscordEvent.TIMER,
  handlerIdentifier: shoutoutPermsIdentifier,
})
class ShoutoutTimer extends CommandHandler<DiscordEvent.TIMER> {
  async handle(timer: Timer): Promise<void> {
    const data = timer.data as unknown as ShoutoutPermsData;
    const channel = bot.channels.resolve(data.channelId) as TextChannel;
    const user = bot.users.resolve(data.userId);

    if (!user || !channel) return;

    await channel.permissionOverwrites.delete(user);
  }
}
