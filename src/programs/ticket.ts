import { GuildMember, Message, Role, TextChannel, User } from "discord.js";
import { isAuthorModerator } from "../common/moderator";
import { TextChannelOptions } from "../common/interfaces";
import Tools from "../common/tools";

const ticket = async (message: Message, type: string) => {
  const ticketLogChannel = `${type}-logs`;

  const { moderatorRole, ticketMessage, categoryId } = getDetailsForType(
    type,
    message.member
  );

  //! This comes to us in the format of "![fiyesta|shoutout] [close|logs]?"
  const args = message.cleanContent.split(" ");
  if (
    args[1] &&
    !(args[1] == "close" || args[1] == "logs" || args[1] == "forceclose")
  ) {
    return;
  }
  let channelName = `${type}-${(
    message.author.username + message.author.discriminator
  ).toLowerCase()}`;
  const isForceClose = message.cleanContent.split(" ")[1] == "forceclose";

  const isClose = message.cleanContent.split(" ")[1] == "close";

  if (isClose) {
    const ticketChannel = <TextChannel>message.channel;
    if (ticketChannel.name.startsWith(type)) {
      if (isAuthorModerator(message))
        await createCloseMessage(
          ticketChannel,
          message.author,
          ticketLogChannel
        );
    }
    return;
  }

  if (isForceClose) {
    const ticketChannel = <TextChannel>message.channel;
    if (ticketChannel.name.startsWith(type)) {
      if (isAuthorModerator(message))
        await closeTicket(ticketChannel, message.author, ticketLogChannel);
    }
  } else {
    await message.delete();
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
    channelName = channelName.replace(/\s+/g, "-").toLowerCase();
    if (message.guild.channels.cache.find((c) => c.name === channelName)) {
      message.author.createDM().then((channel) => {
        channel.send(
          "You already have a ticket open, please close that one first before opening another."
        );
      });
      return;
    } else {
      const ticketChannel = await message.guild.channels.create(
        channelName,
        channelOptions
      );

      await ticketChannel.send(
        `${ticketMessage} A ${moderatorRole.toString()} will be with you as soon as possible.`
      );
    }
  }
};

const getDetailsForType = (
  type: string,
  member: GuildMember
): { moderatorRole: Role; ticketMessage: string; categoryId: string } => {
  const findCategoryByName = (name: string) => {
    return member.guild.channels.cache.find((c) =>
      c.name.toLowerCase().includes(name)
    ).id;
  };

  switch (type) {
    case "shoutout":
      return {
        moderatorRole: Tools.getRoleByName(
          process.env.COORDINATOR_ROLE_NAME,
          member.guild
        ),
        ticketMessage: `Hi ${member.toString()}, please list the details of your shoutout below.`,
        categoryId: findCategoryByName("validation"),
      };
    case "fiyesta":
      return {
        moderatorRole: Tools.getRoleByName(
          process.env.ENGINEER_ROLE_NAME,
          member.guild
        ),
        ticketMessage: `Hi ${member.toString()}, please list the details of your proposed FiYESta below and read the <#502198786441871381> while you wait.`,
        categoryId: findCategoryByName("applications"),
      };
  }
};

const closeTicket = async (
  channel: TextChannel,
  member: User,
  logChannelName: string
) => {
  const text = await createOutput(channel, member);
  const logChannel = <TextChannel>(
    channel.guild.channels.cache.find((c) => c.name.startsWith(logChannelName))
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

export default ticket;
