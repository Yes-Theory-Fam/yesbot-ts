import {
  Client,
  Guild,
  MessageReaction,
  PartialUser,
  Snowflake,
  TextChannel,
  User,
} from "discord.js";
import bot from "../index";
import { textLog } from "../common/moderator";
import { Valentine } from "../programs";
import prisma from "../prisma";

class ReactionRemove {
  bot: Client;
  messageId: Snowflake;
  user: User;
  reaction: string;
  channel: TextChannel;
  guild: Guild;
  messageReaction: MessageReaction;

  constructor(messageReaction: MessageReaction, user: User | PartialUser) {
    this.bot = bot;
    this.user = <User>user;
    this.messageId = messageReaction.message.id;
    this.reaction = messageReaction.emoji.name;
    this.channel = <TextChannel>messageReaction.message.channel;
    this.guild = <Guild>this.channel.guild;
    this.messageReaction = messageReaction;
    if (this.channel.name != "pick-your-color" && !this.user.bot) this.main();
  }

  async main() {
    const reactRoleObjects = await prisma.reactionRole.findMany({
      where: {
        messageId: this.messageId,
        channelId: this.channel.id,
        reaction: this.reaction,
      },
    });

    reactRoleObjects.forEach((reactionRole) => {
      const guildMember = this.guild.member(this.user);
      const roleToAdd = this.guild.roles.resolve(reactionRole.roleId);
      guildMember.roles.remove(roleToAdd);
    });

    Valentine.signoutReaction(this.messageReaction, this.user);
    this.handleChannelToggleReaction();
  }

  async handleChannelToggleReaction() {
    const toggle = await prisma.channelToggle.findFirst({
      where: {
        emoji: this.reaction,
        messageId: this.messageId,
      },
    });
    if (!toggle) {
      return;
    }

    const channel = this.guild.channels.cache.find(
      (c) => c.id === toggle.channel
    );

    if (!channel) {
      await textLog(
        `I can't find this channel <#${toggle.channel}>. Has it been deleted?`
      );
      return;
    }
    await channel.permissionOverwrites.get(this.user.id)?.delete();
  }
}

export default ReactionRemove;
