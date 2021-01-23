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
import { ChannelToggleRepository, ReactionRoleRepository } from "../entities";
import { textLog } from "../common/moderator";
import { Valentine } from "../programs";

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
    const reactionRoleRepository = await ReactionRoleRepository();
    const reactRoleObjects = await reactionRoleRepository.find({
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
    const channelToggleRepository = await ChannelToggleRepository();
    const toggle = await channelToggleRepository.findOne({
      where: {
        emoji: this.reaction,
        message: this.messageId,
      },
    });
    if (toggle === undefined) {
      return;
    }

    const channel = this.guild.channels.cache.find(
      (c) => c.id === toggle.channel
    );

    if (channel === undefined) {
      textLog(
        `I can't find this channel <#${channel.id}>. Has it been deleted?`
      );
      return;
    }
    await channel.permissionOverwrites.get(this.user.id)?.delete();
  }
}

export default ReactionRemove;
