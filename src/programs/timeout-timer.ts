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

const timeoutTimerIdentifier = "timeouttimer";

interface TimeoutTimerData {
  userId: Snowflake;
}

@Command({
  event: DiscordEvent.MESSAGE,
  requiredRoles: ["Support"],
  trigger: "!timeoutTimer",
  description: "This handler starts the timeout timer for the timedout user",
})
class TimeoutTimer implements CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message): Promise<void> {
    const words = message.content.split(/\s+/);
    const targetedUser = message.mentions.users.first();
    const time = Number(words[2]);

    if (!targetedUser || !time) {
      return Tools.handleUserError(
        message,
        "The syntax for this command is `!timeoutTimer` {USER} {TIME IN MINUTES} {REASON (OPTIONAL)}"
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
    const guild = bot.guilds.resolve(process.env.GUILD_ID);
    const guildMember = guild.members.resolve(data.userId);
    const logChannel = guild.channels.cache.find(
      (channel) => channel.name === "bot-output"
    ) as TextChannel;
    const timeoutRole = guild.roles.cache.find((r) => r.name === "Time Out");

    try {
      await guildMember.roles.remove(timeoutRole);
      await logChannel.send(`<@${guildMember.id}> was pardoned!`);
    } catch (e) {
      await logChannel.send(
        `I could not remove the time out role from <@${guildMember.id}>, was it removed manually?`
      );
    }
  }
}
