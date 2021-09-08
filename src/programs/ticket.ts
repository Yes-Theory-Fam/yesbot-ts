import { GuildMember, Message, TextChannel, User } from "discord.js";
import { TextChannelOptions } from "../common/interfaces";
import Tools from "../common/tools";
import { Command, CommandHandler, DiscordEvent } from "../event-distribution";

@Command({
  event: DiscordEvent.MESSAGE,
  trigger: "!shoutout",
  description: "This handler is to create a shoutout ticket.",
})
class OpenShoutoutTicket implements CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message): Promise<void> {
    await message.delete();

    const channelName = getChannelName(message, "shoutout");

    if (await hasTicket(message, channelName)) {
      return;
    }

    const moderatorRole = Tools.getRoleByName(
      process.env.MODERATOR_ROLE_NAME,
      message.guild
    );
    const ticketChannel = await createTicket(
      message,
      channelName,
      "validation"
    );

    await ticketChannel.send(
      `Hi ${message.member.toString()}, please list the details of your shoutout below. A ${moderatorRole.toString()} will be with you as soon as possible.`
    );
  }
}
//Commented out code yes i know but fiyesta's are discontinued due to the pandemic.
/*@Command({
  event: DiscordEvent.MESSAGE,
  trigger: "!fiyesta",
  description: "This handler is to open a fiyesta ticket.",
})
class OpenFiyestaTicket implements CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message): Promise<void> {
    await message.delete();

    const channelName = getChannelName(message, "fiyesta");

    if (await hasTicket(message, channelName)) {
      return;
    }

    const moderatorRole = Tools.getRoleByName(
      process.env.MODERATOR_ROLE_NAME,
      message.guild
    );
    const ticketChannel = await createTicket(
      message,
      channelName,
      "applications"
    );

    await ticketChannel.send(
      `Hi ${message.member.toString()}, please list the details of your proposed FiYESta below and read the <#502198786441871381> while you wait. A ${moderatorRole.toString()} will be with you as soon as possible.`
    );
  }
}*/

@Command({
  event: DiscordEvent.MESSAGE,
  trigger: "!ticket",
  subTrigger: "forceclose",
  allowedRoles: ["Support"],
  description: "This handler is to forceclose a ticket.",
})
class ForceCloseTicket implements CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message): Promise<void> {
    const channel = message.channel as TextChannel;
    const type = channel.name.split("-")[0];
    await closeTicket(channel, message.author, type);
  }
}

@Command({
  event: DiscordEvent.MESSAGE,
  trigger: "!ticket",
  subTrigger: "close",
  allowedRoles: ["Support"],
  description: "This handler is to close a ticket.",
})
class CloseTicket implements CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message): Promise<void> {
    const channel = message.channel as TextChannel;
    const type = channel.name.split("-")[0];
    await createCloseMessage(channel, message.author, type);
  }
}

const closeTicket = async (
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

async function createOutput(
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

async function createCloseMessage(
  channel: TextChannel,
  member: User,
  TICKET_LOG_CHANNEL: string
) {
  let message = await channel.send(
    "This ticket is now closing, please react with ✅ to close this issue. If you would like to also receive logs of this conversation, please react with :bookmark_tabs:"
  );

  await message.react("📑");
  await message.react("✅");

  message
    .awaitReactions(
      (reaction: any, user: User) => {
        return (
          ["✅", "📑"].includes(reaction.emoji.name) &&
          user.id != message.author.id
        );
      },
      { max: 1, time: 60000, errors: ["time"] }
    )

    .then((collected) => {
      const reaction = collected.first();
      const user = reaction.users.cache.find((u) => !u.bot);
      if (reaction.emoji.toString() === "📑") {
        user
          .createDM()
          .then(async (dm) =>
            dm.send(await createOutput(channel, member), { split: true })
          );
      }
      closeTicket(
        reaction.message.channel as TextChannel,
        user,
        TICKET_LOG_CHANNEL
      );
    });
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

const getChannelName = (message: Message, ticketType: string) => {
  let channelName = `${ticketType}-${(
    message.author.username + message.author.discriminator
  ).toLowerCase()}`;
  channelName = channelName.replace(/\s+/g, "-").toLowerCase();
  return channelName.replace(/[^0-9A-Z\s+-]/gi, "");
};

const createTicket = async (
  message: Message,
  channelName: string,
  ticketType: string
): Promise<TextChannel> => {
  const categoryId = message.guild.channels.cache.find((c) =>
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
    parent: categoryId,
  };

  return await message.guild.channels.create(channelName, channelOptions);
};
