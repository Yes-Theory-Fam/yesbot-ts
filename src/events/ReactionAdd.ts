import {
  Guild,
  Message,
  MessageReaction,
  PartialUser,
  Snowflake,
  TextChannel,
  User,
  Client,
} from "discord.js";
import bot from "../index";
import Tools from "../common/tools";
import {
  AdventureGame,
  BuddyProject,
  BuddyProjectGhost,
  GroupManagerTools,
  NitroColors,
  PollsManager,
  Valentine,
} from "../programs";
import { MessageRepository, ReactionRoleRepository } from "../entities";
import { hasRole } from "../common/moderator";
import { ModeratorPollMirror } from "../programs/PollsManager";

class ReactionAdd {
  bot: Client;
  channel: TextChannel;
  guild: Guild;
  message: Message;
  messageId: Snowflake;
  messageReaction: MessageReaction;
  pureEmoji: any;
  reaction: string;
  user: User;

  constructor(messageReaction: MessageReaction, user: User | PartialUser) {
    this.bot = bot;
    this.user = <User>user;
    this.message = messageReaction.message;
    this.messageId = messageReaction.message.id;
    this.reaction = messageReaction.emoji.name;
    this.pureEmoji = messageReaction.emoji.toString();
    this.channel = <TextChannel>messageReaction.message.channel;
    this.guild = <Guild>this.channel.guild;
    this.messageReaction = messageReaction;
    if (!this.user.bot) this.main();
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
      const bpRole = Tools.getRoleByName("Buddy Project 2020", this.guild);
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
    reactRoleObjects.forEach(async (reactionRole) => {
      const guildMember =
        this.guild.member(this.user) ??
        (await this.guild.members.fetch(this.user));
      const roleToAdd = this.guild.roles.resolve(reactionRole.roleId);

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
    ModeratorPollMirror(this.messageReaction, this.user);
    Valentine.signupReaction(this.messageReaction, this.user);
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
