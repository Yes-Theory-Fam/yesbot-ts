import {
  Message,
  Guild,
  TextChannel,
  OverwriteResolvable,
  PermissionOverwriteOption,
} from "discord.js";
import Tools from "../common/tools";

const targetChannelNames = [
  {
    name: "start-here",
    readOnly: true,
  },
  { name: "flag-drop", readOnly: false },
];

const templateMode = async (message: Message) => {
  const arg = message.content.split(" ")[1];
  switch (arg) {
    case "on":
      await applyPermissions(message.guild, on);
      break;
    case "off":
      await applyPermissions(message.guild, off);
      break;
    default:
      return Tools.handleUserError(message, "Argument must be on or off!");
  }

  message.reply("Completed.");
};

const on = async (
  guild: Guild,
  readOnly: boolean
): Promise<OverwriteResolvable[]> => {
  const unassignedRole = Tools.getRoleByName("Unassigned", guild);
  return [
    {
      type: "role",
      id: unassignedRole.id,
      allow: ["VIEW_CHANNEL", readOnly ? 0 : "SEND_MESSAGES"],
    },
    {
      type: "role",
      id: guild.roles.everyone.id,
      deny: "VIEW_CHANNEL",
    },
  ];
};

const off = async (guild: Guild, readOnly: boolean) => {
  const updatedManager = await guild.roles.fetch();
  const prefix = "I'm from ";
  const countryRoles = updatedManager.cache
    .filter((role) => role.name.startsWith(prefix))
    .map((role) => role.id);

  const toWelcomePermissions = (id: string): OverwriteResolvable => {
    return {
      id,
      type: "role",
      deny: "VIEW_CHANNEL",
    };
  };

  const unassignedRole = Tools.getRoleByName("Unassigned", guild);
  // Duplicate entry for everyone is intended to ensure everyone is denied read access until all country permissions are set
  const permissions: OverwriteResolvable[] = [
    {
      type: "role",
      id: unassignedRole.id,
      allow: ["VIEW_CHANNEL", readOnly ? 0 : "SEND_MESSAGES"],
    },
    {
      id: guild.roles.everyone.id,
      type: "role",
      deny: "VIEW_CHANNEL",
    },
    ...countryRoles.map(toWelcomePermissions),
    {
      id: guild.roles.everyone.id,
      type: "role",
      allow: "VIEW_CHANNEL",
      deny: readOnly ? "SEND_MESSAGES" : 0,
    },
  ];

  return permissions;
};

type PermissionFunction = (
  guild: Guild,
  readOnly: boolean
) => Promise<OverwriteResolvable[]>;

const applyPermissions = async (
  guild: Guild,
  permissionFunction: PermissionFunction
) => {
  const channels = guild.channels.cache
    .filter((c) => targetChannelNames.map((n) => n.name).includes(c.name))
    .array();
  for (const channel of channels) {
    if (!(channel instanceof TextChannel)) return;
    const readOnly = targetChannelNames.find(
      (entry) => entry.name === channel.name
    ).readOnly;
    const permissions = [
      ...alwaysPresent(guild),
      ...(await permissionFunction(guild, readOnly)),
    ];

    // Find Germany and shut it down once and for all!
    const firstHundred = permissions.splice(0, 100);
    await channel.overwritePermissions(
      firstHundred,
      "Restructuring for the template."
    );

    for (const perm of permissions) {
      await channel.updateOverwrite(
        perm.id,
        overwriteToPermissionOverwriteOption(perm)
      );
    }
  }
};

const alwaysPresent = (guild: Guild): OverwriteResolvable[] => {
  const support = Tools.getRoleByName("Support", guild);
  const timeOut = Tools.getRoleByName("Time Out", guild);
  const dyno = Tools.getRoleByName("Dyno", guild);

  return [
    {
      id: support.id,
      allow: ["VIEW_CHANNEL", "SEND_MESSAGES"],
      type: "role",
    },
    {
      id: timeOut.id,
      deny: "SEND_MESSAGES",
      type: "role",
    },
    {
      id: dyno.id,
      allow: "VIEW_CHANNEL",
      type: "role",
    },
  ];
};

const overwriteToPermissionOverwriteOption = (
  overwrite: OverwriteResolvable
): PermissionOverwriteOption => {
  let read = null;
  let send = null;

  if (
    overwrite.allow === "VIEW_CHANNEL" ||
    (Array.isArray(overwrite.allow) && overwrite.allow.includes("VIEW_CHANNEL"))
  )
    read = true;

  if (
    overwrite.allow === "SEND_MESSAGES" ||
    (Array.isArray(overwrite.allow) &&
      overwrite.allow.includes("SEND_MESSAGES"))
  )
    send = true;

  if (
    overwrite.deny === "VIEW_CHANNEL" ||
    (Array.isArray(overwrite.deny) && overwrite.deny.includes("VIEW_CHANNEL"))
  )
    read = false;

  if (
    overwrite.deny === "SEND_MESSAGES" ||
    (Array.isArray(overwrite.deny) && overwrite.deny.includes("SEND_MESSAGES"))
  )
    send = false;

  return {
    VIEW_CHANNEL: read,
    SEND_MESSAGES: send,
  };
};

export default templateMode;
