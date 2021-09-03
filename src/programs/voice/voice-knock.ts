import { Message, MessageReaction, User } from "discord.js";
import VoiceOnDemandTools, { maxLimit } from "./common";
import Tools from "../../common/tools";
import {
  Command,
  DiscordEvent,
  CommandHandler,
} from "../../event-distribution";

@Command({
  event: DiscordEvent.MESSAGE,
  trigger: "!voice",
  subTrigger: "knock",
  allowedRoles: ["Yes Theory"],
  channelNames: ["bot-commands"],
  description:
    "This handler is for you to be able to knock on a voice channel to gain access to it, if it there is no room!",
})
class KnockOnDemand implements CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message): Promise<void> {
    const owner = message.mentions.users.first();
    if (!owner) {
      return Tools.handleUserError(
        message,
        "You have to ping the user you want to join!"
      );
    }

    const member = message.guild.member(owner);
    const channel = await VoiceOnDemandTools.getVoiceChannel(member);

    if (!channel) {
      return Tools.handleUserError(
        message,
        "That user doesn't have a channel!"
      );
    }

    if (
      channel.members.some((member) => member.user.id === message.author.id)
    ) {
      return Tools.handleUserError(message, "You just knocked from inside!");
    }

    if (channel.members.size < channel.userLimit) {
      return Tools.handleUserError(
        message,
        "That channel has free space; you can just join!"
      );
    }

    if (channel.members.size === maxLimit) {
      return Tools.handleUserError(
        message,
        "That channel is already at the maximum limit, sorry!"
      );
    }

    const accessMessage = await message.channel.send(
      `<@${owner.id}>, <@${message.author.id}> wants to join your voice channel. Allow?`
    );

    await accessMessage.react("👍");

    const filter = (reaction: MessageReaction, user: User) =>
      user.id === owner.id && reaction.emoji.name === "👍";
    const vote = (
      await accessMessage.awaitReactions(filter, {
        max: 1,
        time: 60000,
      })
    ).first();

    await accessMessage.delete();

    if (!vote) {
      await message.reply(`sorry but ${member.displayName} didn't respond.`);
      return;
    }

    await message.reply("you were let in!");
    const limit = Math.min(maxLimit, channel.userLimit + 1);
    await VoiceOnDemandTools.updateLimit(channel, limit);
  }
}
