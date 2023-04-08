import {
  ChannelType,
  GuildChannelCreateOptions,
  Message,
  OverwriteResolvable,
  PermissionsBitField,
  TextChannel,
  User,
} from "discord.js";
import Tools from "../../common/tools";

export const closeTicket = async (
  channel: TextChannel,
  member: User,
  logChannelName: string
) => {
  const text = await createOutput(channel, member);
  const logChannel = <TextChannel>(
    channel.guild.channels.cache.find(
      (c) => c.name.startsWith(logChannelName) && c.name.endsWith("logs")
    )
  );
  const messages = Tools.splitMessage(text);
  for (const message of messages) {
    await logChannel.send(message);
  }
  await channel.delete();
};

export async function createOutput(
  channel: TextChannel,
  member: User
): Promise<string> {
  let text: string = "**Ticket Log below for <@" + member.id + ">**\n";
  let lastDate = "";
  (await channel.messages.fetch())
    .map((message) => {
      let [year, month, date, hour, min] = timeConverter(
        message.createdTimestamp
      );
      let dateHeader = `** ____________${date} ${month} ${year}____________**\n`;
      if (lastDate != dateHeader) {
        text = text + dateHeader;
        lastDate = dateHeader;
      }
      min = min.toString().length == 1 ? `0${min}` : min;
      return `*[${hour}:${min}]* **${message.author.username}**: ${message.cleanContent}`;
    })
    .reverse()
    .forEach((line) => (text = text + line + "\n"));
  return text;
}

function timeConverter(unixTimestamp: number) {
  const date = new Date(unixTimestamp);
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const year = date.getFullYear();
  const month = months[date.getMonth()];
  const day = date.getDate();
  const hour = date.getHours();
  const min = date.getMinutes();
  const sec = date.getSeconds();
  return [year, month, day, hour, min, sec];
}

const hasTicket = async (message: Message, channelName: string) => {
  const channel = message.guild?.channels.cache.find(
    (c) => c.name === channelName
  );
  if (!channel) return false;

  message.author.createDM().then((channel) => {
    channel.send(
      "You already have a ticket open, please close that one first before opening another."
    );
  });
  return true;
};

export const getChannelName = (user: User, ticketType: TicketType) => {
  let channelName = `${ticketType.toLowerCase()}-${(
    user.username + user.discriminator
  ).toLowerCase()}`;
  channelName = channelName.replace(/\s+/g, "-").toLowerCase();
  channelName = channelName.replace(/-+/g, "-");
  return channelName.replace(/[^\dA-Z\s+-]/gi, "");
};

const createTicket = async (
  message: Message,
  channelName: string,
  ticketType: string
): Promise<TextChannel> => {
  if (!message.guild)
    throw new Error("Trying to create Ticket outside of guild");

  const category = message.guild.channels.cache.find(
    (c) =>
      c.name.toLowerCase().includes(ticketType) &&
      c.type === ChannelType.GuildCategory
  )?.id;

  const moderatorRole = Tools.getRoleByName(
    process.env.MODERATOR_ROLE_NAME,
    message.guild
  );

  const permissionOverwrites: OverwriteResolvable[] = [
    {
      id: message.guild.id,
      deny: [PermissionsBitField.Flags.ViewChannel],
    },
    {
      id: message.author.id,
      allow: [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.ReadMessageHistory,
        PermissionsBitField.Flags.SendMessages,
      ],
      deny: [PermissionsBitField.Flags.AddReactions],
    },
  ];

  if (moderatorRole) {
    permissionOverwrites.push({
      id: moderatorRole.id,
      allow: [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.ReadMessageHistory,
        PermissionsBitField.Flags.SendMessages,
      ],
    });
  }

  const channelOptions: GuildChannelCreateOptions = {
    name: channelName,
    topic: "Support ticket for " + message.member?.user.username,
    type: ChannelType.GuildText,
    permissionOverwrites,
    parent: category,
  };

  return await message.guild.channels.create(channelOptions);
};

export const enum TicketType {
  SHOUTOUT = "SHOUTOUT",
  TRAVEL = "TRAVEL",
  FIYESTA = "FIYESTA",
}

const ticketTypeToCategory: Record<TicketType, string> = {
  [TicketType.SHOUTOUT]: "validation",
  [TicketType.TRAVEL]: "tickets",
  [TicketType.FIYESTA]: "applications",
};

export const maybeCreateTicket = async (
  triggerMessage: Message,
  ticketType: TicketType,
  initialMessageText: string,
  pingSupport = true
): Promise<TextChannel | undefined> => {
  if (!triggerMessage.guild) return;

  await triggerMessage.delete();

  const channelName = getChannelName(triggerMessage.author, ticketType);

  if (await hasTicket(triggerMessage, channelName)) {
    return;
  }

  const moderatorRole = Tools.getRoleByName(
    process.env.MODERATOR_ROLE_NAME,
    triggerMessage.guild
  );

  const ticketChannel = await createTicket(
    triggerMessage,
    channelName,
    ticketTypeToCategory[ticketType]
  );

  const message =
    initialMessageText +
    (pingSupport
      ? `\nA ${moderatorRole?.toString()} will be with you as soon as possible.`
      : "");

  await ticketChannel.send(message);

  return ticketChannel;
};
