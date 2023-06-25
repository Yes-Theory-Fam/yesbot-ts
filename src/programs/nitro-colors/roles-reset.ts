import bot from "../../index";
import cron from "node-cron";
import { nitroRolesCache, colorSelectionMessage, logger } from ".";
import Tools from "../../common/tools";
import { TextChannel } from "discord.js";

export class RoleResetCron {
  static init() {
    const CRON =
      process.env.NODE_ENV === "development" ? "* * * * *" : "0 0 1 * *";

    // Schedule a cron task every month
    cron.schedule(CRON, async () => {
      // Remove color roles from each user
      for (const role of nitroRolesCache.values()) {
        for (const member of role.members.values()) {
          await member.roles.remove(role);
        }
      }

      // Clean up pick-your-color messages
      const channel = bot.guilds
        .resolve(process.env.GUILD_ID)
        ?.channels.cache.find(
          (c) => c.name === "pick-your-color"
        ) as TextChannel;
      const nitroBoosterRole = Tools.getRoleByName(
        "Nitro Booster",
        channel.guild
      );

      if (!nitroBoosterRole) {
        logger.error("Could not find Nitro Booster role!");
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
        content: `${nitroBoosterRole} It is time to pick a new color for the new month!`,
      });

      logger.debug("Executed cleanup");
    });

    logger.debug("Initialized!");
  }
}
