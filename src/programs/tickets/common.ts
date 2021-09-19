import { Message, TextChannel, User } from "discord.js";
import Tools from "../../common/tools";
import { TextChannelOptions } from "../../common/interfaces";

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
  await logChannel.send(text, { split: true });
  await channel.delete("Closed Ticket");
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

function timeConverter(UNIX_timestamp: number) {
  const a = new Date(UNIX_timestamp);
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
  const year = a.getFullYear();
  const month = months[a.getMonth()];
  const date = a.getDate();
  const hour = a.getHours();
  const min = a.getMinutes();
  const sec = a.getSeconds();
  return [year, month, date, hour, min, sec];
}

const hasTicket = async (message: Message, channelName: string) => {
  if (message.guild.channels.cache.find((c) => c.name === channelName)) {
    message.author.createDM().then((channel) => {
      channel.send(
        "You already have a ticket open, please close that one first before opening another."
      );
    });
    return true;
  }
  return false;
};

export const getChannelName = (user: User, ticketType: TicketType) => {
  let channelName = `${ticketType.toLowerCase()}-${(
    user.username + user.discriminator
  ).toLowerCase()}`;
  channelName = channelName.replace(/\s+/g, "-").toLowerCase();
  return channelName.replace(/[^0-9A-Z\s+-]/gi, "");
};

const createTicket = async (
  message: Message,
  channelName: string,
  ticketType: string
): Promise<TextChannel> => {
  const category = message.guild.channels.cache.find((c) =>
    c.name.toLowerCase().includes(ticketType)
  );

  const moderatorRole = Tools.getRoleByName(
    process.env.MODERATOR_ROLE_NAME,
    message.guild
  );

  const channelOptions: TextChannelOptions = {
    topic: "Support ticket for " + message.member.user.username,
    type: "text",
    permissionOverwrites: [
      {
        id: message.guild.id,
        deny: ["VIEW_CHANNEL"],
      },
      {
        id: message.author.id,
        allow: ["VIEW_CHANNEL", "READ_MESSAGE_HISTORY", "SEND_MESSAGES"],
        deny: ["ADD_REACTIONS"],
      },
      {
        id: moderatorRole.id,
        allow: ["VIEW_CHANNEL", "READ_MESSAGE_HISTORY", "SEND_MESSAGES"],
      },
    ],
    parent: category,
  };

  return await message.guild.channels.create(channelName, channelOptions);
};

export enum TicketType {
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
      ? `\nA ${moderatorRole.toString()} will be with you as soon as possible.`
      : "");

  await ticketChannel.send(message);

  return ticketChannel;
};
