import fs from "fs";
import {
  Guild,
  GuildMember,
  Message,
  PartialGuildMember,
  Snowflake,
  TextChannel,
  User,
  Channel,
} from "discord.js";
import { ChannelToggleRepository } from "../entities";
import { textLog } from "./moderator";
import { Logger } from "./Logger";

class Tools {
  static stringToWords(inputStr: string): Array<string> {
    return <string[]>inputStr.split(" ");
  }

  static async addThumbs(message: Message) {
    await message.react("👍");
    await message.react("👎");
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
        const reason =
          "FAILED TO READ FILE " + `./src/collections/${filename}.json`;
        Logger("tools", "resolveFile", reason);
        reject(reason);
      }
    });
  }

  static async getFirstReaction(message: Message) {
    const collected = await message.awaitReactions(
      (reaction: any, user: User) => {
        return !user.bot;
      },
      { max: 1, time: 6000000, errors: ["time"] }
    );
    return collected.first().emoji.toString();
  }

  static async getMessageById(
    messageId: Snowflake,
    guild: Guild,
    channelId: string
  ): Promise<[Message, Channel]> {
    try {
      const channel: TextChannel = <TextChannel>(
        guild.channels.cache.find((c) => c.id == channelId)
      );
      const message = await channel.messages.fetch(messageId);
      return [message, channel];
    } catch (error) {
      Logger("tools", "getMessageById", error);
      return [null, null];
    }
  }

  static async getRoleById(roleId: Snowflake, guild: Guild) {
    return guild.roles.resolve(roleId);
  }

  static getRoleByName(roleName: string, guild: Guild) {
    return guild.roles.cache.find(
      (r) => r.name.toLowerCase() === roleName.toLowerCase()
    );
  }

  static async handleUserError(message: Message, reply: string) {
    message.reply(reply).then((msg) => {
      message.delete();
      msg.delete({ timeout: 10000 });
    });
  }

  static async addPerUserPermissions(
    reactionName: string,
    messageId: string,
    guild: Guild,
    user: GuildMember | PartialGuildMember
  ) {
    try {
      const channelToggleRepository = await ChannelToggleRepository();
      const toggle = await channelToggleRepository.findOne({
        where: {
          emoji: reactionName,
          message: messageId,
        },
      });

      if (toggle !== undefined) {
        const channel = guild.channels.cache.find(
          (channel) => channel.id === toggle.channel
        );
        if (channel === undefined) {
          await textLog(
            `I can't find this channel <#${toggle.channel}>. Has it been deleted?`
          );
          return;
        }

        await channel.updateOverwrite(user.id, {
          VIEW_CHANNEL: true,
        });
      }
    } catch (err) {
      Logger("tools", "addUserPermissions", err);
    }
  }
}

export default Tools;
