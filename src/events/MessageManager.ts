import {
  Client,
  DMChannel,
  Message,
  TextChannel,
  User,
  GuildChannel,
} from "discord.js";
import {
  BirthdayManager,
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
  Unassigned,
} from "../programs";
import bot from "../index";
import state from "../common/state";
import { hasRole, textLog, getMember } from "../common/moderator";
import {
  abuseMe,
  addVote,
  deleteMessages,
  randomReply,
  sendLove,
} from "../common/CustomMethods";
import Tools from "../common/tools";
import {
  DailyChallenge,
  postDailyMessage,
  saveToDb,
} from "../programs/DailyChallenge";

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
  async routeMessage() {
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
      await this.message.delete();
      const timeoutRole = Tools.getRoleByName("Time Out", this.message.guild);
      const supportRole = Tools.getRoleByName(
        process.env.MODERATOR_ROLE_NAME,
        this.message.guild
      );
      await this.message.member.roles.add(timeoutRole);
      textLog(
        `<@&${supportRole.id}>: <@${this.message.author.id}> just tagged more than 20 people in a single message in <#${this.message.channel.id}>. The message has been deleted and they have beeen timed out.`
      ).then(() => textLog(`Message content was: ${this.message.content}`));
    }

    const filteredWords = ["nigger", "nigga"];
    const lowerCaseMessage = this.message.content.toLowerCase();
    if (filteredWords.some((word) => lowerCaseMessage.includes(word))) {
      await this.message.delete();
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
          await this.message.reply("https://youtu.be/v-JOe-xqPN0");
        }
        break;
      case "flag-drop":
        await WhereAreYouFromManager(this.message);
        break;

      case "chat":
      case "chat-too":
      case "4th-chat":
        if (firstWord === "@someone") await Someone(this.message);
        if (firstWord === "!deadchat") await Deadchat(this.message);
        if (firstWord === "!translate") abuseMe(this.message);
        break;

      case "trends":
        if (firstWord === "!trend")
          await TopicManager.TopicManager(this.message);
        if (firstWord === "!trendSet")
          await TopicManager.setTopic(this.message);
        break;

      case "daily-challenge":
        if (firstWord === "!challenge") await DailyChallenge(this.message);
        break;
      case "permanent-testing":
        if (firstWord === "!export") await ExportManager(this.message);
        if (
          firstWord === "!group" &&
          !this.message.content.toLowerCase().startsWith("!group toggle")
        )
          await GroupManager(this.message, true);
        if (firstWord === "!profile") await ProfileManager(this.message);
        if (firstWord === "!templateMode") await TemplateMode(this.message);
        if (firstWord === "!addChallenge")
          await saveToDb("daily-challenge", restOfMessage, this.message);
        if (firstWord === "!todayChallenge")
          await postDailyMessage(this.bot, this.message);
        if (firstWord === "!valentine")
          await Valentine.changeEventState(this.message);
        if (firstWord === "!unassignedRoleToggle")
          await Unassigned.UnassignedRoleAssignToggle(this.message);
        if (firstWord === "!unassignedRoleStatus")
          await Unassigned.UnassignedRoleAssignStatus(this.message);
        break;
      case "bot-commands":
        if (
          firstWord === "!group" &&
          !this.message.content.toLowerCase().startsWith("!group toggle")
        )
          await GroupManager(this.message, true);
        if (firstWord === "!profile") await ProfileManager(this.message);
        if (firstWord === "!birthday") await BirthdayManager(this.message);

        if (firstWord === "!voice") await VoiceOnDemand(this.message);
        if (firstWord === "!video") {
          await this.message.reply("https://youtu.be/v-JOe-xqPN0");
        }
        if (firstWord === "!map") await MapTools.map(this.message);
        if (firstWord === "!mapadd") await MapTools.mapAdd(this.message);
        break;

      case "polls":
        await PollsManager(this.message);
        break;

      case "feature-requests":
        this.message.react("👍").then(() => this.message.react("👎"));
        break;

      case "bot-games":
        if (firstWord === "!game") await Game.showGameEmbed(this.message);
        break;
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
      await this.message.member.roles.remove(guildRole);
    }
    if (firstWord === "!topic") TopicManager.TopicManager(this.message);
    // if (firstWord === "!fiyesta") Ticket(this.message, "fiyesta");
    if (firstWord === "!resources") await Resource(this.message);
    if (firstWord === "!shoutout") await Ticket(this.message, "shoutout");
    if (firstWord === "!addvote") await addVote(this.message);
    if (firstWord === "!delete")
      hasRole(this.message.member, "Support")
        ? await deleteMessages(this.message)
        : null;
    if (firstWord === "!role") await ReactRole(this.message);
    if (firstWord === "F") await this.message.react("🇫");
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
      await this.message.react("👀");
    }

    if (this.message.content.toLowerCase().startsWith("!group toggle"))
      await GroupManager(this.message, true);

    if (words.includes("@group")) await GroupManager(this.message, false);
  }

  async routeDm() {
    const member = getMember(this.message.author.id);
    const dmChannel = this.message.channel;

    if (!member) {
      await dmChannel.send(
        "Hey, I am the bot of the Yes Theory Fam Discord Server :) Looks like you are not on it currently, so I cannot really do a lot for you. If you'd like to join, click here: https://discord.gg/yestheory"
      );
      return;
    }

    if (state.ignoredGroupDMs.includes(dmChannel.id)) return;

    const command = this.message.content.split(" ")[0];
    switch (command) {
      case "!menu":
        await DMMenu.showMenu(this.message);
        break;
      // When nothing else makes sense we just guess that they are playing a game.
      // handleGameInput will drop the message if it doesn't understand either.
      default:
        Game.handleGameInput(this.message);
    }
  }
}
export default MessageManager;
