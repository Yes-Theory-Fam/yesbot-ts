import Discord, {
  Snowflake,
  User,
  Channel,
  Guild,
  TextChannel,
  Emoji,
  GuildCreateChannelOptions,
  PartialUser,
  Message,
  GuildMember,
  MessageReaction,
  DMChannel,
} from "discord.js";
import bot from "../index";
import Tools from "../common/tools";
import AdventureGame from "../programs/AdventureGame";
import { MessageRepository } from "../entities/Message";
import { backfillReactions } from "../programs/GroupManager";
import { hasRole } from "../common/moderator";
import { GUILD_ID } from "../const";
import BuddyProjectGhost, {
  BuddyConfirmation,
} from "../programs/BuddyProjectGhost";
import { removeEntry, BuddyProjectSignup } from "../programs/BuddyProject";

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
        this.guild.channels.cache.find((c) => c.name === "buddy-project-output")
      );
      const output = await BuddyProjectGhost(this.user, this.guild);
      outputChannel.send(output.message);
      if (!output.success) {
        this.messageReaction.users.remove(this.user);
      }
    }
    if (this.pureEmoji === "🧙" && this.channel.name == "discord-disaster") {
      AdventureGame(this.user, this.guild, this.bot);
    }
    if (
      this.channel.name === "buddy-project-tools" &&
      this.pureEmoji === "🤓" &&
      !this.user.bot
    ) {
      let outputChannel = <TextChannel>(
        this.guild.channels.cache.find((c) => c.name === "buddy-project-output")
      );
      outputChannel.send(
        `<@${this.user}> is signing up again for the relaunch.`
      );
      outputChannel.send(
        await BuddyProjectSignup(this.guild.member(this.user))
      );
    }

    const reactRoleObjects = await Tools.resolveFile("reactRoleObjects");
    reactRoleObjects.forEach((element: any) => {
      if (
        this.messageId === element.messageId &&
        this.reaction === element.reaction
      ) {
        const guildMember = this.guild.members.cache.find(
          (m) => m.id == this.user.id
        );
        const roleToAdd = this.guild.roles.cache.find(
          (r) => r.id == element.roleId
        );

        if (
          this.hasNitroColour(guildMember) &&
          this.messageId == "637401981262102578"
        ) {
          guildMember
            .createDM()
            .then((dm) =>
              dm.send(
                "You can't assign yourself a new colour yet, please wait until the end of the month!"
              )
            );
        } else {
          guildMember.roles.add(roleToAdd);
        }
      }
    });

    if (this.channel instanceof DMChannel && this.pureEmoji === "✅") {
      const guild = bot.guilds.resolve(GUILD_ID);
      BuddyConfirmation(this.user, guild);
      return;
    }

    this.handleChannelToggleReaction();
  }

  hasNitroColour = (member: GuildMember): boolean => {
    const nitroColours: string[] = [
      "636122019183722496",
      "636902084108615690",
      "636901944790876160",
      "636525712450256896",
      "636670666447388702",
    ];
    let hasColour = false;
    nitroColours.forEach((colour) => {
      if (member.roles.cache.find((role) => role.id === colour)) {
        hasColour = true;
      }
    });
    return hasColour;
  };

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
      backfillReactions(this.messageId, this.channel.id, this.guild);
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
