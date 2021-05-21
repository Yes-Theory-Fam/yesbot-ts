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
  GroupManagerTools,
  NitroColors,
  Valentine,
} from "../programs";
import { hasRole } from "../common/moderator";
import { ModeratorPollMirror } from "../programs/PollsManager";
import prisma from "../prisma";

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
    if (this.pureEmoji === "🧙" && this.channel.name == "discord-disaster") {
      await AdventureGame(this.user, this.guild, this.bot);
    }
    const reactRoleObjects = await prisma.reactionRole.findMany({
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

        await this.messageReaction.users.remove(guildMember);
      } else {
        await guildMember.roles.add(roleToAdd);
      }
    });

    await this.handleChannelToggleReaction();
    await ModeratorPollMirror(this.messageReaction, this.user);
    await Valentine.signupReaction(this.messageReaction, this.user);
  }

  async handleChannelToggleReaction() {
    const storedMessage = await prisma.message.findUnique({
      where: { id: this.messageId },
    });

    if (!storedMessage) {
      // abort if we don't know of a trigger for this message
      return;
    }

    const member = this.guild.member(this.user);
    // Catch users who are timeouted and deny their attempts at accessing other channels
    if (hasRole(member, "Time Out")) {
      const reaction = this.message.reactions.cache.find(
        (reaction) => reaction.emoji.name === this.reaction
      );
      await reaction.users.remove(member);
      return;
    }

    // Make sure we know what channel this message is forever
    if (storedMessage.channel === null) {
      storedMessage.channel = this.channel.id;
      await prisma.message.update({
        data: storedMessage,
        where: { id: storedMessage.id },
      });
      // record what channel this message is in
      await this.message.react(this.reaction);
      await GroupManagerTools.backfillReactions(
        this.messageId,
        this.channel.id,
        this.guild
      );
    }

    await Tools.addPerUserPermissions(
      this.reaction,
      this.messageId,
      this.guild,
      this.guild.member(this.user)
    );
  }
}

export default ReactionAdd;
