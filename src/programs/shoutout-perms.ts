import { Command, CommandHandler, DiscordEvent } from "../event-distribution";
import {
  ChannelType,
  Client,
  ChatInputCommandInteraction,
  Guild,
  Snowflake,
  OverwriteType,
  TextChannel,
  ApplicationCommandOptionType,
  PermissionOverwrites,
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
const shoutoutTimers: Record<Snowflake, string> = {};

const getSendPerms = (channel: TextChannel, user: User) => {
  return channel.permissionOverwrites.cache
    .filter((c) => c.type === OverwriteType.Member && c.id === user.id)
    .first();
};

const getShoutoutsChannel = (guild: Guild) => {
  return guild.channels.cache
    .filter(
      (c) => c.isTextBased() && (c as TextChannel).name === ChatNames.SHOUTOUTS
    )
    .first();
};

const deletePerms = async (
  userId: Snowflake,
  sendPerms: PermissionOverwrites
) => {
  const timerId = shoutoutTimers[userId];
  await sendPerms.delete();

  delete shoutoutTimers[userId];
  if (timerId !== null) TimerService.cancelTimer(timerId);
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
        content: "Can not send this here!",
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

    // there must be a way to type this in a more typescript-ish way
    if (shoutouts === null || shoutouts?.type !== ChannelType.GuildText) {
      await interaction.reply({
        content: `Couldn't find the <#${ChatNames.SHOUTOUTS}> channel!`,
        ephemeral: true,
      });
      return;
    }

    // Check whether there's an instance
    // If there is an existing perm overwrite, remove it
    const sendPerms = getSendPerms(shoutouts, user);
    if (sendPerms && getSendPerms(shoutouts, user)) {
      deletePerms(user.id, sendPerms);

      // TODO: Make this message a bit nicer!
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
    shoutoutTimers[user.id] = timerId;

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

    if (sendPerms) await deletePerms(sender.id, sendPerms);
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

    if (user === null || channel === null) return;
    const sendPerms = getSendPerms(channel, user);

    if (sendPerms) await deletePerms(user.id, sendPerms);
  }
}

const logger = createYesBotLogger("shoutouts", ShoutoutTimer.name);
