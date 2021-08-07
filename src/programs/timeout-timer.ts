import { Command, CommandHandler, DiscordEvent } from "../event-distribution";
import {
  DiscordAPIError,
  GuildMember,
  Message,
  Snowflake,
  TextChannel,
  User,
} from "discord.js";
import { TimerService } from "./timer/timer.service";
import { Timer } from "@yes-theory-fam/database/client";
import bot from "../index";
import Tools from "../common/tools";
import { hasRole } from "../common/moderator";
//I have absolute no idea wtf i am doing :)
const timeoutTimerIdentifier = "timeouttimer";

interface TimeoutTimerData {
  userId: Snowflake;
  channelId: Snowflake;
}

@Command({
  event: DiscordEvent.MESSAGE,
  requiredRoles: ["Support"],
  trigger: "!timeoutTimer",
  description: "This handler starts the timeout timer for the timedout user",
})
class TimeoutTimer implements CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message): Promise<void> {
    if (message.system) {
      await message.delete();
      return;
    }

    const words = message.content.split(/\s+/);
    const targetedUser = message.mentions.users.first();
    const time = Number(words[2]);

    if (!targetedUser && !time) {
      return Tools.handleUserError(
        message,
        "The syntax for this command is `!timeoutTimer` {USER} {TIME IN MINUTES} {REASON (OPTIONAL)}"
      );
    }

    if (!targetedUser) {
      return Tools.handleUserError(
        message,
        "You have to ping the user you want to timeout!"
      );
    }

    if (!time) {
      return Tools.handleUserError(
        message,
        "You must set a time, it is interpreted in minutes"
      );
    }

    const targetedGuildMember = message.guild.members.resolve(targetedUser);
    const timeoutRole = message.guild.roles.cache.find(
      (r) => r.name === "Time Out"
    );

    if (hasRole(targetedGuildMember, "Time Out")) {
      return Tools.handleUserError(message, "User is already timed out!");
    }
    try {
      await targetedGuildMember.roles.add(timeoutRole);
      await message.react("👍");
    } catch (e) {
      await message.react("👎");
      return;
    }

    const executeTime = new Date();
    executeTime.setMinutes(executeTime.getMinutes() + time);
    await TimerService.createTimer(timeoutTimerIdentifier, executeTime, {
      userId: targetedUser.id,
      channelId: message.channel.id,
    });
  }
}

@Command({
  event: DiscordEvent.TIMER,
  handlerIdentifier: timeoutTimerIdentifier,
})
class TimeoutPardon implements CommandHandler<DiscordEvent.TIMER> {
  async handle(timer: Timer): Promise<void> {
    const data = timer.data as unknown as TimeoutTimerData;
    const channel = bot.channels.resolve(data.channelId) as TextChannel;
    const memberGuild = channel.guild.members.resolve(data.userId);
    const logChannel = channel.guild.channels.cache.find(
      (channel) => channel.name === "bot-output"
    ) as TextChannel;
    const timeoutRole = channel.guild.roles.cache.find(
      (r) => r.name === "Time Out"
    );

    try {
      await memberGuild.roles.remove(timeoutRole);
      await logChannel.send(`<@${memberGuild.id}> was pardoned!`);
    } catch (e) {
      await logChannel.send(
        `I could not remove the time out role from <@${memberGuild.id}>, was it removed manually?`
      );
    }
  }
}
