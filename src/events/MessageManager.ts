import {
  Client,
  CollectorFilter,
  DMChannel,
  Message,
  MessageReaction,
  TextChannel,
  User,
  GuildChannel,
} from "discord.js";
import {
  BirthdayManager,
  BuddyProjectManager,
  Deadchat,
  ExportManager,
  GroupManager,
  MapTools,
  PollsManager,
  ProfileManager,
  ReactRole,
  Resource,
  Someone,
  TemplateMode,
  Ticket,
  TopicManager,
  Valentine,
  VoiceOnDemand,
  WhereAreYouFromManager,
  Game,
  DMMenu,
} from "../programs";
import bot from "../index";
import { MODERATOR_ROLE_NAME } from "../const";
import state from "../common/state";
import { hasRole, textLog, getMember } from "../common/moderator";
import {
  abuseMe,
  addVote,
  deleteMessages,
  proposeNameChange,
  randomReply,
  sendLove,
} from "../common/CustomMethods";
import Tools from "../common/tools";
import {
  DailyChallenge,
  postDailyMessage,
  saveToDb,
} from "../programs/DailyChallenge";
import { GameHub } from "../games";

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
    const mentionedMembers = this.message.mentions.users.size;
    if (mentionedMembers > 20 && !this.message.author.bot) {
      const whitelistedRoles = ["support", "yes theory", "seek discomfort"];
      const hasWhitelistedRole = this.message.member.roles.cache.some((r) =>
        whitelistedRoles.includes(r.name.toLowerCase())
      );
      if (hasWhitelistedRole) return;

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
        `<@&${supportRole.id}>: <@${this.message.author.id}> just tagged more than 20 people in a single message in <#${this.message.channel.id}>. The message has been deleted and they have beeen timed out.`
      ).then(() => textLog(`Message content was: ${this.message.content}`));
    }

    const filteredWords = ["nigger", "nigga"];
    const lowerCaseMessage = this.message.content.toLowerCase();
    if (filteredWords.some((word) => lowerCaseMessage.includes(word))) {
      this.message.delete();
      this.message.author
        .createDM()
        .then((dm) =>
          dm.send(
            `Usage of the N word is absolutely banned within this server. Please refer to the <#450102410262609943>.`
          )
        );

      return;
    }

    const words = this.message.content.split(/\s+/);
    const channel = <TextChannel>this.message.channel;
    const firstWord = words[0];
    const restOfMessage = words.slice(1).join(" ");

    switch (channel.name) {
      case "welcome-chat":
        if (firstWord === "!video") {
          this.message.reply("https://youtu.be/v-JOe-xqPN0");
        }
        break;
      case "flag-drop":
        WhereAreYouFromManager(this.message);
        break;

      case "chat":
      case "chat-too":
      case "4th-chat":
        if (firstWord === "@someone") Someone(this.message);
        if (firstWord === "!deadchat") Deadchat(this.message);
        if (firstWord === "!translate") abuseMe(this.message);
        break;

      case "trends":
        if (firstWord === "!trend") TopicManager.default(this.message);
        if (firstWord === "!trendSet") TopicManager.setTopic(this.message);
        break;

      case "daily-challenge":
        if (firstWord === "!challenge") DailyChallenge(this.message);
        break;
      case "permanent-testing":
        if (firstWord === "!export") ExportManager(this.message);
        if (
          firstWord === "!group" &&
          !this.message.content.toLowerCase().startsWith("!group toggle")
        )
          GroupManager(this.message, true);
        if (firstWord === "!profile") ProfileManager(this.message);
        if (firstWord === "!templateMode") TemplateMode(this.message);
        if (firstWord === "!addChallenge")
          saveToDb("daily-challenge", restOfMessage, this.message);
        if (firstWord === "!todayChallenge")
          postDailyMessage(this.bot, this.message);
        if (firstWord === "!valentine")
          Valentine.changeEventState(this.message);
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
        if (firstWord === "!map") MapTools.map(this.message);
        if (firstWord === "!mapadd") MapTools.mapAdd(this.message);
        break;

      case "polls":
        PollsManager(this.message);
        break;

      case "feature-requests":
        this.message.react("👍").then(() => this.message.react("👎"));
        break;

      case "bot-games":
        if (firstWord === "!game") Game.showGameEmbed(this.message);
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

    const parentChannel = (this.message.channel as GuildChannel).parent;
    if (
      parentChannel &&
      parentChannel.name.toLowerCase().endsWith("entertainment")
    ) {
      Game.handleGameInput(this.message);
    }

    if (firstWord === "!goodbye") {
      const guildRole = this.message.guild.roles.cache.find(
        (r) => r.name.toLowerCase() === "head"
      );
      this.message.member.roles.remove(guildRole);
    }
    if (firstWord === "!topic") TopicManager.default(this.message);
    // if (firstWord === "!fiyesta") Ticket(this.message, "fiyesta");
    if (firstWord === "!resources") Resource(this.message);
    if (firstWord === "!shoutout") Ticket(this.message, "shoutout");
    if (firstWord === "!addvote") addVote(this.message);
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
      this.message.react("👀");
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

    const command = this.message.content.split(" ")[0];
    switch (command) {
      case "!menu":
        DMMenu.showMenu(this.message);
        break;
      // When nothing else makes sense we just guess that they are playing a game.
      // handleGameInput will drop the message if it doesn't understand either.
      default:
        Game.handleGameInput(this.message);
    }
  }
}
export default MessageManager;
