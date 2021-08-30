import { Message } from "discord.js";

import Tools from "../../common/tools";
import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../event-distribution";

const maxLimit = 10;

@Command({
  event: DiscordEvent.MESSAGE,
  trigger: "!voice",
  subTrigger: "limit",
  allowedRoles: ["Yes Theory"],
  channelNames: ["bot-commands"],
  description:
    "This handler is for you to be able to control the user limit of your voice channel!",
})
class HandleLimitCommand implements CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message): Promise<void> {
    const requestedLimit = Number(message.content.split(" ")[2]);
    if (!requestedLimit) {
      await Tools.handleUserError(message, "The limit has to be a number");
      return;
    }

    const channel = await Tools.getVoiceChannel(message.member);

    if (!channel) {
      await Tools.handleUserError(
        message,
        "You don't have a voice channel. You can create one using `!voice create` and an optional limit"
      );
      return;
    }

    const limit = await Tools.handleLimitCommand(
      message,
      requestedLimit,
      maxLimit
    );

    if (!limit) {
      return;
    }

    await Tools.updateLimit(channel, limit);
    await message.reply(
      `Successfully changed the limit of your room to ${limit}`
    );
  }
}

@Command({
  event: DiscordEvent.MESSAGE,
  trigger: "!voice",
  subTrigger: "shrink",
  allowedRoles: ["Yes Theory"],
  channelNames: ["bot-commands"],
  description:
    "This handler is for you to change the user limit of the voice channel to the current amount of users in the voice channel",
})
class HandleShrinkLimitCommand implements CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message): Promise<void> {
    const channel = await Tools.getVoiceChannel(message.member);

    if (!channel) {
      await Tools.handleUserError(
        message,
        "You don't have a voice channel. You can create one using `!voice create` and an optional limit"
      );
      return;
    }

    const limit = Math.max(2, channel.members.size);
    await Tools.updateLimit(channel, limit);
    await message.reply(
      `Successfully changed the limit of your room to ${limit}`
    );
  }
}

@Command({
  event: DiscordEvent.MESSAGE,
  trigger: "!voice",
  subTrigger: "up",
  allowedRoles: ["Yes Theory"],
  channelNames: ["bot-commands"],
  description: "This handler is for you to add +1 to the current user limit",
})
class HandleUpLimitCommand implements CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message): Promise<void> {
    const channel = await Tools.getVoiceChannel(message.member);

    if (!channel) {
      await Tools.handleUserError(
        message,
        "You don't have a voice channel. You can create one using `!voice create` and an optional limit"
      );
      return;
    }

    const limit = Math.min(maxLimit, channel.userLimit + 1);
    await Tools.updateLimit(channel, limit);
    await message.reply(
      `Successfully changed the limit of your room to ${limit}`
    );
  }
}

@Command({
  event: DiscordEvent.MESSAGE,
  trigger: "!voice",
  subTrigger: "down",
  allowedRoles: ["Yes Theory"],
  channelNames: ["bot-commands"],
  description: "This handler is for you to lower the user limit by 1",
})
class HandleDownLimitCommand implements CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message): Promise<void> {
    const channel = message.member.voice.channel;
    const limit = Math.max(2, channel.userLimit - 1);
    await Tools.updateLimit(channel, limit);
    await message.reply(
      `Successfully changed the limit of your room to ${limit}`
    );
  }
}
