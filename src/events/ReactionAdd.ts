import Discord, {
  Guild,
  GuildMember,
  Message,
  MessageReaction,
  PartialUser,
  Snowflake,
  TextChannel,
  User,
} from "discord.js";
import bot from "../index";
import Tools from "../common/tools";
import {
  AdventureGame,
  BuddyProject,
  BuddyProjectGhost,
  GroupManagerTools,
  NitroColors,
} from "../programs";
import { MessageRepository, ReactionRoleRepository } from "../entities";
import { hasRole } from "../common/moderator";

class ReactionAdd {
  bot: Discord.Client;
  message: Message;
  messageId: Snowflake;
  user: User;
  reaction: string;
  channel: TextChannel;
  guild: Guild;
  pureEmoji: any;
  messageReaction: MessageReaction;

  constructor(
    messageReaction: Discord.MessageReaction,
    user: User | PartialUser
  ) {
    this.bot = bot;
    this.user = <User>user;
    this.message = messageReaction.message;
    this.messageId = messageReaction.message.id;
    this.reaction = messageReaction.emoji.name;
    this.pureEmoji = messageReaction.emoji.toString();
    this.channel = <TextChannel>messageReaction.message.channel;
    this.guild = <Guild>this.channel.guild;
    this.messageReaction = messageReaction;
    this.main();
  }

  async main() {
    if (
      this.channel.name === "buddy-project-tools" &&
      this.pureEmoji === "👻" &&
      !this.user.bot
    ) {
      let outputChannel = <TextChannel>(
        this.guild.channels.cache.find((c) => c.name === "buddy-project-ghosts")
      );
      const output = await BuddyProjectGhost(this.user, this.guild);
      outputChannel.send(output.message);

      this.messageReaction.users.remove(this.user);
    }
    if (this.pureEmoji === "🧙" && this.channel.name == "discord-disaster") {
      AdventureGame(this.user, this.guild, this.bot);
    }
    if (
      this.channel.name === "buddy-project" &&
      this.pureEmoji === "💬" &&
      !this.user.bot
    ) {
      const member = this.guild.members.cache.find((m) => m.user === this.user);
      const bpRole = this.guild.roles.cache.find(
        (r) => r.name === "Buddy Project 2020"
      );
      member.roles.add(bpRole);
      let outputChannel = <TextChannel>(
        this.guild.channels.cache.find((c) => c.name === "buddy-project-output")
      );
      outputChannel.send(
        `<@${this.user}> is signing up again for the relaunch.`
      );
      outputChannel.send(
        await BuddyProject.BuddyProjectSignup(this.guild.member(this.user))
      );
    }
    const reactionRoleRepository = await ReactionRoleRepository();
    const reactRoleObjects = await reactionRoleRepository.find({
      where: {
        messageId: this.messageId,
        channelId: this.channel.id,
        reaction: this.reaction,
      },
    });
    reactRoleObjects.forEach((reactionRole) => {
      const guildMember = this.guild.members.cache.find(
        (m) => m.id == this.user.id
      );
      const roleToAdd = this.guild.roles.cache.find(
        (r) => r.id == reactionRole.roleId
      );

      if (
        NitroColors.isColorSelectionMessage(this.messageId) &&
        NitroColors.memberHasNitroColor(guildMember)
      ) {
        guildMember
          .createDM()
          .then((dm) =>
            dm.send(
              "You can't assign yourself a new colour yet, please wait until the end of the month!"
            )
          );

        this.messageReaction.users.remove(guildMember);
      } else {
        guildMember.roles.add(roleToAdd);
      }
    });

    this.handleChannelToggleReaction();
  }

  async handleChannelToggleReaction() {
    const messageRepository = await MessageRepository();
    const storedMessage = await messageRepository.findOne({
      where: {
        id: this.messageId,
      },
    });

    if (storedMessage === undefined) {
      // abort if we don't know of a trigger for this message
      return;
    }

    const member = this.guild.member(this.user);
    // Catch users who are timeouted and deny their attempts at accessing other channels
    if (hasRole(member, "Time Out")) {
      const reaction = this.message.reactions.cache.find(
        (reaction) => reaction.emoji.name === this.reaction
      );
      reaction.users.remove(member);
      return;
    }

    // Make sure we know what channel this message is forever
    if (storedMessage.channel === null) {
      // record what channel this message is in
      await messageRepository.save({
        ...storedMessage,
        channel: this.channel.id,
      });
      this.message.react(this.reaction);
      GroupManagerTools.backfillReactions(
        this.messageId,
        this.channel.id,
        this.guild
      );
    }

    Tools.addPerUserPermissions(
      this.reaction,
      this.messageId,
      this.guild,
      this.guild.member(this.user)
    );
  }
}

export default ReactionAdd;
