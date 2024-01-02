import {
  CategoryChannel,
  ChannelType,
  Guild,
  OverwriteResolvable,
  PermissionsBitField,
} from "discord.js";
import { ChatNames } from "../../../../collections/chat-names";
import Tools from "../../../../common/tools";

const getEventCategory = (guild: Guild) => {
  const found = guild.channels.cache.find(
    (c): c is CategoryChannel =>
      c.type === ChannelType.GuildCategory &&
      c.name.toLowerCase().endsWith("events")
  );

  if (!found) throw new Error("Could not find events category");

  return found;
};

const getPermissionOverwrites = (
  guild: Guild,
  readonly: boolean
): OverwriteResolvable[] => {
  const support = Tools.getRoleByName("Support", guild);
  if (!support) throw new Error("Could not find support role");

  const member = Tools.getRoleByName("Member", guild);
  if (!member) throw new Error("Could not find member role");

  const everyoneDeniedPermissions = [PermissionsBitField.Flags.ViewChannel];
  if (readonly) {
    everyoneDeniedPermissions.push(PermissionsBitField.Flags.SendMessages);
  }

  return [
    {
      id: guild.roles.everyone.id,
      deny: everyoneDeniedPermissions,
    },
    {
      id: member.id,
      deny: everyoneDeniedPermissions,
    },
    {
      id: support.id,
      allow: [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
      ],
    },
  ];
};

const createChannel = async (guild: Guild, name: string, readonly: boolean) => {
  const existing = guild.channels.cache.find(
    (c) => c.name === name && c.parent?.name.toLowerCase().endsWith("events")
  );

  if (existing) return existing;

  const parent = getEventCategory(guild);
  const permissionOverwrites = getPermissionOverwrites(guild, readonly);

  return await guild.channels.create({
    name,
    parent,
    type: ChannelType.GuildText,
    permissionOverwrites,
  });
};

export const createBuddyProjectChannels = async (guild: Guild) => {
  const info = await createChannel(guild, ChatNames.BUDDY_PROJECT_INFO, true);
  const bpChat = await createChannel(guild, ChatNames.BUDDY_PROJECT, false);
  const dmsDisabled = await createChannel(
    guild,
    ChatNames.BUDDY_PROJECT_DMS_DISABLED,
    true
  );

  return [info, bpChat, dmsDisabled];
};
