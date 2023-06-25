import bot from "../index";
import {
  Client,
  Collection,
  GuildMember,
  Message,
  MessageReaction,
  PartialUser,
  Role,
  Snowflake,
  TextChannel,
  User,
} from "discord.js";
import { createYesBotLogger } from "../log";
import { Command, CommandHandler, DiscordEvent } from "../event-distribution";
import cron from "node-cron";
import prisma from "../prisma";
import Tools from "../common/tools";

const logger = createYesBotLogger("programs", "NitroColors");

let nitroRolesCache: Collection<Snowflake, Role>;
let colorSelectionMessage: Message;

@Command({
  event: DiscordEvent.READY,
  description: "This handler is to load the Nitro color roles on bot startup",
})
class CacheNitroColors implements CommandHandler<DiscordEvent.READY> {
  async handle(bot: Client) {
    try {
      const pickYourColorChannel = bot.guilds
        .resolve(process.env.GUILD_ID)
        ?.channels.cache.find(
          (channel) => channel.name === "pick-your-color"
        ) as TextChannel;

      colorSelectionMessage = await pickYourColorChannel.messages
        .fetch({ limit: 10 })
        .then((messages) => [...messages.values()].reverse()[0]);

      if (!colorSelectionMessage) {
        logger.warn(
          "Didn't find a message in #pick-your-color to load Nitro colors from. Skipping setting up nitro colors."
        );
        nitroRolesCache = new Collection([]);
        return;
      }

      nitroRolesCache = colorSelectionMessage.mentions.roles;
    } catch (err) {
      logger.error("Cache Nitro Colors Error: ", err);
    }
  }
}

@Command({
  event: DiscordEvent.GUILD_MEMBER_UPDATE,
  roleNamesRemoved: [
    "Support",
    "Nitro Booster",
    "Developer",
    "Companion",
    "Organizer",
  ],
  description:
    "This handler is to remove Nitro color role if the user has lost one of the two roles.",
})
class RemoveNitroColorIfNotAllowed
  implements CommandHandler<DiscordEvent.GUILD_MEMBER_UPDATE>
{
  async handle(member: GuildMember) {
    const nitroColor = member.roles.cache.find((r) =>
      nitroRolesCache.some((role) => role.id === r.id)
    );

    if (!nitroColor) return;

    colorSelectionMessage.reactions.cache.find(
      (reactions) => !!reactions.users.remove(member)
    );
    await member.roles.remove(nitroColor);
  }
}

@Command({
  event: DiscordEvent.REACTION_ADD,
  emoji: "",
  channelNames: ["pick-your-color"],
  description:
    "This handler is for when a user reactions to one of the emoji to get Nitro color role",
})
class NitroColorSelector implements CommandHandler<DiscordEvent.REACTION_ADD> {
  async handle(
    reaction: MessageReaction,
    user: User | PartialUser
  ): Promise<void> {
    if (user.bot) return;

    const { message } = reaction;
    const guild = bot.guilds.resolve(process.env.GUILD_ID);

    if (!guild) return;

    const guildMember =
      guild.members.resolve(user.id) ?? (await guild.members.fetch(user.id));

    if (
      isColorSelectionMessage(reaction.message.id) &&
      memberHasNitroColor(guildMember)
    ) {
      guildMember
        .createDM()
        .then((dm) =>
          dm.send(
            "You can't assign yourself a new colour yet, please wait until the end of the month!"
          )
        );

      await reaction.users.remove(guildMember);
      return;
    }

    const pickYourColorChannel = message.channel as TextChannel;

    const reactRoleObjects = await prisma.reactionRole.findMany({
      where: {
        messageId: message.id,
        channelId: pickYourColorChannel.id,
        reaction: reaction.emoji.toString(),
      },
    });

    for (const reactionRole of reactRoleObjects) {
      const roleToAdd = guild.roles.resolve(reactionRole.roleId);

      if (roleToAdd) {
        await guildMember.roles.add(roleToAdd);
      }
    }
  }
}

export class RoleResetCron {
  static init() {
    const CRON =
      process.env.NODE_ENV === "development" ? "* * * * *" : "0 0 1 * *";

    // Schedule a cron task every month
    cron.schedule(CRON, async () => {
      // Remove color roles from each user
      nitroRolesCache.forEach((role) => {
        role.members.forEach(async (member) => {
          await member.roles.remove(role);
        });
      });

      // Clean up pick-your-color messages
      const channel = bot.guilds
        .resolve(process.env.GUILD_ID)
        ?.channels.cache.find(
          (c) => c.name === "pick-your-color"
        ) as TextChannel;
      const nitroBoosterRole = Tools.getRoleByName("Nitro Booster", channel.guild);

      if (!nitroBoosterRole) {
        logger.error('Could not find Nitro Booster role!');
        return;
      }

      // Remove all messages sent by the bot
      const messages = await channel.messages.fetch({ limit: 5 });
      for (const message of messages.values()) {
        if (message.id !== colorSelectionMessage.id) {
          await message.delete();
          continue;
        }

        // Remove all reactions from the reactions message
        const reactionsCache = colorSelectionMessage.reactions.cache;
        for (const reaction of reactionsCache.values()) {
          const reactionUsers = await reaction.users.fetch();
          const usersToRemove = reactionUsers.filter(
            (user) => user.id !== bot.user?.id
          );

          for (const [userId] of usersToRemove) {
            await reaction.users.remove(userId);
          }
        }
      }

      // Let Nitro boosters know about the new month's change!
      await channel.send({
        content:
          `${nitroBoosterRole} It is time to pick a new color for the new month!`,
      });

      logger.debug("Executed cleanup");
    });

    logger.debug("Initialized!");
  }
}
const memberHasNitroColor = (member: GuildMember) =>
  member.roles.cache.some((role) =>
    nitroRolesCache.some((r) => r.id === role.id)
  );

export const isColorSelectionMessage = (messageId: Snowflake) =>
  colorSelectionMessage.id === messageId;
