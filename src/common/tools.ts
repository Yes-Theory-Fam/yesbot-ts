import fs, { exists } from "fs";
import { resolve } from "dns";
import Discord, {
  TextChannel,
  Snowflake,
  Guild,
  GuildMember,
  PartialGuildMember,
} from "discord.js";
import { ChannelToggleRepository } from "../entities/ChannelToggle";
import { textLog } from "./moderator";

interface LocalUser {
  id: string;
  groups: string[];
}
class Tools {
  static isProd(): boolean {
    return process.platform === "linux";
  }

  static paramsToArgs(params: string) {
    return params.split(" ");
  }

  static stringToWords(inputStr: string): Array<string> {
    return <string[]>inputStr.split(" ");
  }

  static getYesGuild(bot: Discord.Client) {
    const guild = bot.guilds.cache.find(
      (g) => g.name === process.env.PROD_GUILD_NAME
    );
    return guild;
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
        reject(reason);
      }
    });
  }

  static async writeFile(filename: string, data: any) {
    fs.writeFile(
      `./src/collections/${filename}.json`,
      JSON.stringify(data),
      () => {
        return true;
      }
    );
  }

  static async updateFile(filename: string, data: any) {
    fs.readFile(
      `./src/collections/${filename}.json`,
      "utf-8",
      (err, string) => {
        let existingArray = JSON.parse(string);

        existingArray.push(data);

        fs.writeFile(
          `./src/collections/${filename}.json`,
          JSON.stringify(existingArray),
          () => {
            return true;
          }
        );
      }
    );
  }

  static censor(key: any, value: any) {
    if (value && typeof value === "object" && value.parent) {
      value.parent = value.parent.name;
    }
    return value;
  }

  static async getMessageById(
    messageId: Snowflake,
    guild: Discord.Guild,
    channelId: string
  ) {
    //? Return [Message, Channel]
    try {
      const channel: TextChannel = <TextChannel>(
        guild.channels.cache.find((c) => c.id == channelId)
      );
      const message = await channel.messages.fetch(messageId);
      return [message, channel];
    } catch (error) {
      return [null, null];
    }
  }

  static async getRoleById(roleId: Snowflake, guild: Discord.Guild) {
    return guild.roles.cache.find((r) => r.id == roleId);
  }

  static async addPerUserPermissions(
    reactionName: string,
    messageId: string,
    guild: Guild,
    user: GuildMember | PartialGuildMember
  ) {
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
        textLog(
          `I can't find this channel <#${channel.id}>. Has it been deleted?`
        );
        return;
      }

      await channel.updateOverwrite(user.id, {
        VIEW_CHANNEL: true,
      });
    }
  }
}

export default Tools;
