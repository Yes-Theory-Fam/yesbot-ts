import {
  Channel,
  Collection,
  Guild,
  GuildChannel,
  GuildMember,
  Message,
  MessageReaction,
  PartialGuildMember,
  Snowflake,
  TextChannel,
  User,
} from "discord.js";
import fs from "fs";
import { createYesBotLogger } from "../log.js";
import prisma from "../prisma.js";
import { textLog } from "./moderator.js";
import eventDistribution from "../event-distribution/index.js";

export const unicodeEmojiRegex =
  /^(\p{RI}\p{RI}|\p{Emoji}(\p{Emoji_Modifier_Base}|\uFE0F\u20E3?|[\u{E0020}-\u{E007E}]+\u{E007F})?(\u{200D}\p{Emoji}(\p{Emoji_Modifier_Base}|\uFE0F\u20E3?|[\u{E0020}-\u{E007E}]+\u{E007F})?)*)/gu;

const logger = createYesBotLogger("common", "Tools");

class Tools {
  // Shamelessly stolen from before it was removed from discord.js
  // https://github.com/discordjs/discord.js/blob/622c77ba7af56ec3dc17a47aae5379e2358e8c95/src/util/Util.js#L77-L113
  static splitMessage(
    text: string,
    { maxLength = 2_000, char = "\n", prepend = "", append = "" } = {}
  ) {
    if (text.length <= maxLength) return [text];
    let splitText = [text];
    if (Array.isArray(char)) {
      while (
        char.length > 0 &&
        splitText.some((elem) => elem.length > maxLength)
      ) {
        const currentChar = char.shift();
        if (currentChar instanceof RegExp) {
          splitText = splitText.flatMap(
            (chunk) => chunk.match(currentChar) ?? ""
          );
        } else {
          splitText = splitText.flatMap((chunk) => chunk.split(currentChar));
        }
      }
    } else {
      splitText = text.split(char);
    }
    if (splitText.some((elem) => elem.length > maxLength))
      throw new RangeError("SPLIT_MAX_LEN");
    const messages = [];
    let msg = "";
    for (const chunk of splitText) {
      if (msg && (msg + char + chunk + append).length > maxLength) {
        messages.push(msg + append);
        msg = prepend;
      }
      msg += (msg && msg !== prepend ? char : "") + chunk;
    }
    return messages.concat(msg).filter((m) => m);
  }

  static stringToWords(inputStr: string): Array<string> {
    return <string[]>inputStr.split(" ");
  }

  static async resolveFile(filename: string): Promise<Object[]> {
    return new Promise((resolve, reject) => {
      try {
        fs.readFile(
          `./src/collections/${filename}.json`,
          "utf-8",
          (err, data) => {
            resolve(JSON.parse(data));
          }
        );
      } catch (error) {
        logger.error(
          `(resolveFile) Failed to read file src/collections/${filename}.json: `,
          error
        );
        reject(error);
      }
    });
  }

  static async getMessageById(
    messageId: Snowflake,
    guild: Guild,
    channelId: string
  ): Promise<[Message, Channel] | null> {
    try {
      const channel: TextChannel = <TextChannel>(
        guild.channels.cache.find((c) => c.id == channelId)
      );
      const message = await channel.messages.fetch(messageId);
      return [message, channel];
    } catch (error) {
      logger.error("(getMessageById) Failed to fetch message", error);
      return null;
    }
  }

  static getRoleByName(roleName: string, guild: Guild) {
    return guild.roles.cache.find(
      (r) => r.name.toLowerCase() === roleName.toLowerCase()
    );
  }

  static async handleUserError(message: Message, reply: string) {
    message.reply(reply).then((msg) => {
      message.delete().catch(() => {});
      setTimeout(() => msg.delete().catch(() => {}), 10000);
    });
  }

  static async addPerUserPermissions(
    reactionName: string,
    messageId: string,
    user: GuildMember | PartialGuildMember
  ) {
    const guild = user.guild;

    try {
      const toggle = await prisma.channelToggle.findFirst({
        where: { emoji: reactionName, messageId },
      });

      if (toggle) {
        const channel = guild.channels.cache.find(
          (channel) => channel.id === toggle.channel
        );
        if (!channel) {
          await textLog(
            `I can't find this channel <#${toggle.channel}>. Has it been deleted?`
          );
          return;
        }

        await (channel as GuildChannel).permissionOverwrites.edit(user.id, {
          ViewChannel: true,
        });
      }
    } catch (err) {
      logger.error(
        "(addPerUserPermissions) Failed to add per user permissions",
        err
      );
    }
  }

  static async getFirstColumnFromGoogleSheet(
    sheetId: string
  ): Promise<string[]> {
    const apiKey = process.env.GOOGLE_API_KEY;
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Sheet1?key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();
    const rows = data.values;

    return rows.flatMap((row: string[]) => row);
  }

  static async isCommandEnabled(name: string, guild: Guild) {
    const commandId = eventDistribution.getIdForCommandName(name);

    const permissions = await guild.commands.permissions.fetch({});
    const appliedPermissions =
      permissions.get(commandId) ?? permissions.get(guild.client.user.id) ?? [];

    const supportId = this.getRoleByName(
      process.env.MODERATOR_ROLE_NAME,
      guild
    )?.id;

    return appliedPermissions.some(
      (p) => p.type === 1 && p.permission && p.id !== supportId
    );
  }

  /**
   * Function adding voting to a message allowing only one reaction per person, returning a record mapping option to an array of the ids of the users who voted that option
   * @param toMessage Message to add the voting to
   * @param options Array of emotes that may be reacted with
   * @param voters Array of user IDs that are allowed to vote
   * @param timeout Timeout of the voting
   * @param allowChangeVote Whether users are allowed to change their vote. If true, their previous vote is reverted, if false any votes following the first one are reverted.
   * @param earlyEndDelay Time between the time that everyone has voted and counting the votes. If not present, the voting will not close automatically when everyone has voted.
   */
  static async addUniqueVote(
    toMessage: Message,
    options: string[],
    voters: Snowflake[],
    timeout = 60000,
    allowChangeVote = true,
    earlyEndDelay?: number
  ): Promise<Record<string, Snowflake[]>> {
    const votes: Record<string, Snowflake[]> = {};

    for (const emoji of options) {
      votes[emoji] = [];
    }

    const addReactions = async () => {
      for (const emoji of options) {
        await toMessage.react(emoji);
      }
    };

    addReactions();

    const collector = toMessage.createReactionCollector({
      filter: (reaction, user) =>
        Tools.signUpFilter(reaction, user, voters, votes, allowChangeVote),
      time: timeout,
    });

    collector.on("collect", (reaction, user) => {
      const emoji = reaction.emoji.name;
      if (!emoji) return;

      // If players are not allowed to change votes and the reaction was collected,
      // they cannot already have an entry in the votes so we can just add them without any further checks.
      if (!allowChangeVote) {
        votes[emoji].push(user.id);
        return;
      }

      // Otherwise we check for old reactions of the player so we can remove them
      const previousReactionsByPlayer = toMessage.reactions.cache.filter(
        (r) =>
          r.users.cache.has(user.id) && r.emoji.name !== reaction.emoji.name
      );
      previousReactionsByPlayer.forEach((reaction) =>
        reaction.users.remove(user.id)
      );

      // Then clear them from the record; probably better not to rely on discord for picking entries
      const emojis = options.filter((option) =>
        votes[option].includes(user.id)
      );
      for (const emoji of emojis) {
        const votedPlayers = votes[emoji];
        const index = votedPlayers.indexOf(user.id);
        if (index > -1) {
          votedPlayers.splice(index, 1);
        }
      }

      // Finally add their vote
      votes[emoji].push(user.id);
    });

    return new Promise((res) => {
      collector.on("end", () => res(votes));
    });
  }

  static async addVote(
    toMessage: Message,
    pickOptions: string[],
    allowedVoterIds: Snowflake[],
    single: false,
    deleteMessage?: boolean,
    timeout?: number
  ): Promise<Collection<Snowflake, MessageReaction>>;

  static async addVote(
    toMessage: Message,
    pickOptions: string[],
    allowedVoterIds: Snowflake[],
    single: true,
    deleteMessage?: boolean,
    timeout?: number
  ): Promise<MessageReaction>;

  static async addVote(
    toMessage: Message,
    pickOptions: string[],
    allowedVoterIds: Snowflake[],
    single: boolean,
    deleteMessage?: boolean,
    timeout?: number
  ): Promise<MessageReaction | Collection<Snowflake, MessageReaction>>;

  static async addVote(
    toMessage: Message,
    pickOptions: string[],
    allowedVoterIds: Snowflake[],
    single: boolean = true,
    deleteMessage = false,
    timeout: number = 60000
  ): Promise<MessageReaction | Collection<Snowflake, MessageReaction>> {
    const filter = (reaction: MessageReaction, user: User) =>
      Boolean(
        reaction.emoji.name &&
          pickOptions.includes(reaction.emoji.name) &&
          allowedVoterIds.includes(user.id)
      );

    // Using a wrapped object allows cancelling adding the reactions from the outside
    const cancellationToken = { cancelled: false };
    const addReactions = async () => {
      try {
        for (let emoji of pickOptions) {
          if (cancellationToken.cancelled) {
            break;
          }
          await toMessage.react(emoji);
        }
      } catch {
        // Skip - Comes up when a reaction is tried to be added to a message that was deleted because the user already selected
      }
    };

    addReactions(); // No await because we don't want to wait

    try {
      const selection = await toMessage.awaitReactions({
        filter,
        max: 1,
        time: timeout,
        errors: ["time"],
      });

      cancellationToken.cancelled = true;

      if (deleteMessage) {
        await toMessage.delete();
      }
      if (single) {
        const result = selection.first();

        if (!result) {
          throw new Error("time");
        }

        return result;
      }

      return selection;
    } catch {
      cancellationToken.cancelled = true;

      if (deleteMessage) {
        await toMessage.delete();
      }
      // TODO
      // Tools.handleUserError(
      //   toReplyMessage,
      //   "For technical reasons I can only wait 60 seconds for your selection."
      // );
      throw "Awaiting reactions timed out";
    }
  }

  static async createVoteMessage(
    toReplyMessage: Message,
    callToActionMessage: string,
    pickOptions: string[],
    single: false,
    timeout?: number
  ): Promise<Collection<Snowflake, MessageReaction>>;

  static async createVoteMessage(
    toReplyMessage: Message,
    callToActionMessage: string,
    pickOptions: string[],
    single: true,
    timeout?: number
  ): Promise<MessageReaction>;

  static async createVoteMessage(
    toReplyMessage: Message,
    callToActionMessage: string,
    pickOptions: string[],
    single: boolean,
    timeout?: number
  ): Promise<MessageReaction | Collection<Snowflake, MessageReaction>>;

  static async createVoteMessage(
    toReplyMessage: Message,
    callToActionMessage: string,
    pickOptions: string[],
    single: boolean = true,
    timeout: number = 60000
  ): Promise<MessageReaction | Collection<Snowflake, MessageReaction>> {
    const reactMessage = await toReplyMessage.reply(callToActionMessage);
    return Tools.addVote(
      reactMessage,
      pickOptions,
      [toReplyMessage.author.id],
      single,
      true,
      timeout
    );
  }

  static shuffleArray<T>(items: T[]): T[] {
    const shallowCopy = [...items];

    for (let i = shallowCopy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * i);
      const temp = shallowCopy[i];
      shallowCopy[i] = shallowCopy[j];
      shallowCopy[j] = temp;
    }

    return shallowCopy;
  }

  /**
   * @param reaction The reaction added by a user
   * @param user The user adding the reaction
   */
  private static signUpFilter(
    reaction: MessageReaction,
    user: User,
    voters: Snowflake[],
    currentVotes: Record<string, Snowflake[]>,
    allowChangeVote: boolean
  ): boolean {
    if (user.bot) return false;

    const disallowedSecondVote =
      !allowChangeVote &&
      Object.values(currentVotes).some((voteArray) =>
        voteArray.includes(user.id)
      );

    if (!voters.includes(user.id) || disallowedSecondVote) {
      reaction.users.remove(user);
      return false;
    }

    return true;
  }
}

export default Tools;
