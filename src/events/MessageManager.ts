import {
  Client,
  CollectorFilter,
  DMChannel,
  Message,
  MessageReaction,
  TextChannel,
  User,
} from "discord.js";
import {
  BirthdayManager,
  BuddyProjectManager,
  Deadchat,
  ExportManager,
  GroupManager,
  PollsManager,
  ProfileManager,
  ReactRole,
  Resource,
  Someone,
  StateRoleFinder,
  Ticket,
  TopicManager,
  Unassigned,
  VoiceOnDemand,
  WhereAreYouFromManager,
} from "../programs";
import bot from "../index";
import { MODERATOR_ROLE_NAME } from "../const";
import state from "../common/state";
import { hasRole, textLog, getMember } from "../common/moderator";
import {
  addVote,
  deleteMessages,
  proposeNameChange,
  randomReply,
  reactWithEmoji,
  sendLove,
  SendMap,
} from "../common/CustomMethods";
import Tools from "../common/tools";

class MessageManager {
  message: Message;
  author: User;
  bot: Client;
  logs: boolean;

  constructor(msg: Message) {
    this.message = msg;
    this.author = msg.author;
    this.bot = bot;
    if (msg.channel.type === "dm" && !msg.author.bot) {
      this.routeDm();
    } else {
      this.routeMessage();
    }
  }
  routeMessage() {
    const filteredWords = ["nigger", "nigga"];
    const mentionedMembers = this.message.mentions.users.size;
    if (mentionedMembers > 20 && !this.message.author.bot) {
      this.author.createDM().then((dm: DMChannel) => {
        dm.send(
          "Hey there! You tagged more than 20 people in a single message. The message has been deleted and you have beeen timed out. Here is the message sent: "
        );
        dm.send(this.message.content);
      });
      this.message.delete();
      const timeoutRole = Tools.getRoleByName("Time Out", this.message.guild);
      const supportRole = Tools.getRoleByName(
        MODERATOR_ROLE_NAME,
        this.message.guild
      );
      this.message.member.roles.add(timeoutRole);
      textLog(
        `<@&${supportRole.id}>: <@${this.message.author.id}> just tagged more than 20 people in a single message. The message has been deleted and they have beeen timed out.`
      );
    }

    const words = this.message.content.split(/\s+/);
    const firstWord = words[0];
    const channel = <TextChannel>this.message.channel;

    const isFiltered = words.some((r) => filteredWords.indexOf(r) !== -1);
    if (isFiltered) {
      this.message.delete();
      this.message.author
        .createDM()
        .then((dm) =>
          dm.send(
            `Usage of the N word is absolutely banned within this server. Please refer to the <#450102410262609943>.`
          )
        );
    }
    switch (channel.name) {
      case "where-are-you-from":
      case "welcome-chat":
        if (firstWord === "!video") {
          this.message.reply("https://youtu.be/v-JOe-xqPN0");
        }
      case "flag-drop":
        if (firstWord == "!usa") SendMap("usa", this.message);
        if (firstWord == "!canada") SendMap("canada", this.message);
        if (firstWord == "!australia") SendMap("australia", this.message);
        if (firstWord == "!uk") SendMap("uk", this.message);
        WhereAreYouFromManager(this.message);
        if (firstWord === "!state") StateRoleFinder(this.message);
        break;

      case "chat":
      case "chat-too":
      case "4th-chat":
        if (firstWord === "@someone") Someone(this.message);
        if (firstWord === "!deadchat") Deadchat(this.message);
        break;

      case "permanent-testing":
        if (firstWord === "!export") ExportManager(this.message);
        if (firstWord === "!unassigned") Unassigned(this.message);
        if (
          firstWord === "!group" &&
          !this.message.content.toLowerCase().startsWith("!group toggle")
        )
          GroupManager(this.message, true);
        if (firstWord === "!profile") ProfileManager(this.message);
        break;

      case "bot-commands":
        if (
          firstWord === "!group" &&
          !this.message.content.toLowerCase().startsWith("!group toggle")
        )
          GroupManager(this.message, true);
        if (firstWord === "!profile") ProfileManager(this.message);
        if (firstWord === "!birthday") BirthdayManager(this.message);

        if (firstWord === "!voice") VoiceOnDemand(this.message);
        if (firstWord === "!video") {
          this.message.reply("https://youtu.be/v-JOe-xqPN0");
        }
        break;

      case "polls":
        PollsManager(this.message);
        break;

      case "feature-requests":
        this.message.react("👍").then(() => this.message.react("👎"));
        break;

      case "buddy-project-output":
        if (firstWord === "!match") BuddyProjectManager(this.message, "match");
        if (firstWord === "!check") BuddyProjectManager(this.message, "check");
        if (firstWord === "!unmatch")
          BuddyProjectManager(this.message, "unmatch");
        if (firstWord === "!clean") BuddyProjectManager(this.message, "clean");
        break;

      case "buddy-project-tools":
        if (firstWord === "!ghost") BuddyProjectManager(this.message, "ghost");
        if (firstWord === "!retry") BuddyProjectManager(this.message, "retry");

      case "buddy-project-chat":
        if (firstWord === "!buddy") BuddyProjectManager(this.message, "buddy");
    }
    if (firstWord === "!goodbye") {
      const guildRole = this.message.guild.roles.cache.find(
        (r) => r.name.toLowerCase() === "head"
      );
      this.message.member.roles.remove(guildRole);
    }
    if (firstWord === "!topic") TopicManager(this.message);
    // if (firstWord === "!fiyesta") Ticket(this.message, "fiyesta");
    if (firstWord === "!resources") Resource(this.message);
    if (firstWord === "!shoutout") Ticket(this.message, "shoutout");
    if (firstWord === "!vote") addVote(this.message);
    if (firstWord === "!delete")
      hasRole(this.message.member, "Support")
        ? deleteMessages(this.message)
        : null;
    if (firstWord === "!role") ReactRole(this.message);
    if (firstWord === "F") this.message.react("🇫");
    if (
      ["i love u yesbot", "i love you yesbot", "yesbot i love you "].includes(
        this.message.content.toLowerCase()
      )
    )
      sendLove(this.message);
    if (
      this.message.content.toLowerCase().startsWith("yesbot") &&
      this.message.content.toLowerCase().endsWith("?")
    )
      randomReply(this.message);
    if (
      this.message.content.toLowerCase().includes("abooz") ||
      this.message.content.toLowerCase().includes("mod abuse")
    ) {
      reactWithEmoji(this.message, "👀");
    }
    if (this.message.content.toLowerCase().startsWith("!group toggle"))
      GroupManager(this.message, true);

    if (words.includes("@group")) GroupManager(this.message, false);
  }

  async routeDm() {
    const member = getMember(this.message.author.id);
    const dmChannel = this.message.channel;

    if (!member) {
      dmChannel.send(
        "Hey, I am the bot of the Yes Theory Fam Discord Server :) Looks like you are not on it currently, so I cannot really do a lot for you. If you'd like to join, click here: https://discord.gg/yestheory"
      );
      return;
    }

    if (state.ignoredGroupDMs.includes(dmChannel.id)) return;
    const removeIgnore = () => {
      const index = state.ignoredGroupDMs.indexOf(dmChannel.id);
      if (index > -1) {
        state.ignoredGroupDMs.splice(index, 1);
      }
    };

    const nameChangeMessage = await this.message.reply(
      "Hey, I'm just a bot! Most of what I can do, I do on the YesFam discord, so talk to me there instead! I can help you change your name, though, if you're new around here. Click the :baby: if you want to change your name!"
    );
    await nameChangeMessage.react("👶");
    const filter: CollectorFilter = (reaction: MessageReaction, user: User) =>
      reaction.emoji.name === "👶" && !user.bot;
    try {
      const reactions = await nameChangeMessage.awaitReactions(filter, {
        time: 60000,
        max: 1,
      });
      if (reactions.size === 0) throw "No reactions";

      const requestMessage = await dmChannel.send(
        "Okay, what's your name then? Please only respond with your name like Henry or Julie, that makes things easier for the Supports! :upside_down:"
      );
      state.ignoredGroupDMs.push(dmChannel.id);
      const nameMessage = await dmChannel.awaitMessages(
        (_, user: User) => !user.bot,
        { time: 60000, max: 1 }
      );
      removeIgnore();

      if (nameMessage.size === 0) {
        requestMessage.delete();
        throw "No response";
      }

      const requestedName = nameMessage.first().content;
      proposeNameChange(requestedName, this.message);
      await requestMessage.delete();
    } catch (err) {
      removeIgnore();
      // Time's up; nothing to do here, really
      dmChannel.send(
        "Because of technical reasons I can only wait 60 seconds for a reaction. I removed the other message to not confuse you. If you need anything from me, just drop me a message!"
      );
    }

    await nameChangeMessage.delete();
  }
}
export default MessageManager;
