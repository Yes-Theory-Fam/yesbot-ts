import bot from "../index";
import {
  Snowflake,
  TextChannel,
  Role,
  Collection,
  GuildMember,
  PartialGuildMember,
  Message,
} from "discord.js";
import { hasRole } from "../common/moderator";

let nitroRolesCache: Collection<Snowflake, Role>;
let colorSelectionMessage: Message;

export const cacheNitroColors = async (guildId: Snowflake) => {
  try {
    const pickYourColorChannel = bot.guilds
      .resolve(guildId)
      .channels.cache.find(
        (channel) => channel.name === "pick-your-color"
      ) as TextChannel;

    colorSelectionMessage = await pickYourColorChannel.messages
      .fetch({ limit: 10 })
      .then((messages) => messages.array().reverse()[0]);

    if (!colorSelectionMessage) {
      console.log(
        "Didn't find a message in #pick-your-color to load Nitro colors from. Skipping setting up nitro colors."
      );
      nitroRolesCache = new Collection([]);
      return;
    }

    nitroRolesCache = colorSelectionMessage.mentions.roles;
  } catch (err) {
    console.log("Cache Nitro Colors Error: ", err.message);
  }
};

export const removeColorIfNotAllowed = async (
  member: GuildMember | PartialGuildMember
) => {
  // At least one is required for a nitro color
  const roleRequirements = ["Nitro Booster", "Support"];

  const nitroColor: Role = member.roles.cache.find((r) =>
    nitroRolesCache.some((role) => role.id === r.id)
  );

  const isColorAllowed = roleRequirements.some((role) => hasRole(member, role));

  if (nitroColor && !isColorAllowed) {
    member.roles.remove(nitroColor);
  }
};

export const memberHasNitroColor = (member: GuildMember) =>
  member.roles.cache.some((role) =>
    nitroRolesCache.some((r) => r.id === role.id)
  );

export const isColorSelectionMessage = (messageId: Snowflake) =>
  colorSelectionMessage.id === messageId;
