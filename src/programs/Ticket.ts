import Discord, {
  OverwriteResolvable,
  SnowflakeUtil,
  TextChannel,
  GuildMember,
  User,
  UserFlags,
} from "discord.js";
import Tools from "../common/tools";
import {
  ENGINEER_ROLE_NAME,
  COORDINATOR_ROLE_NAME,
  MODERATOR_ROLE_NAME,
} from "../const";
import { isAuthorModerator } from "../common/moderator";

export default async function Ticket(pMessage: Discord.Message, type: string) {
  const guild_name = pMessage.guild.name;

  const TICKET_LOG_CHANNEL = `${type}-logs`;

  const CONTEST_CATEGORY_ID =
    guild_name == "Yes Theory Fam" ? "not done" : "695317780198719500";

  const ENGINEER_ROLE_ID = "667747778201649172";
  const COORDINATOR_ROLE_ID = "667747782202884117";
  const SUPPORT_ROLE_ID = "695317778504089609";

  let moderatorRoleName: string;
  let categoryId: string;
  let moderatorRoleId: string;
  let ticketMessage: string;

  switch (type) {
    case "fiyesta":
      moderatorRoleName = ENGINEER_ROLE_NAME;
      categoryId = pMessage.guild.channels.cache.find((c) =>
        c.name.toLowerCase().includes("application")
      ).id;
      moderatorRoleId = pMessage.guild.roles.cache.find((r) =>
        r.name.toLowerCase().includes("server engineer")
      ).id;
      ticketMessage = `Hi ${pMessage.member.toString()}, please list the details of your proposed FiYESta below and read the <#502198786441871381> while you wait.`;
      break;
    case "shoutout":
      moderatorRoleName = COORDINATOR_ROLE_NAME;
      categoryId = pMessage.guild.channels.cache.find((c) =>
        c.name.toLowerCase().includes("validation")
      ).id;
      moderatorRoleId = pMessage.guild.roles.cache.find((r) =>
        r.name.toLowerCase().includes("server coordinator")
      ).id;
      ticketMessage = `Hi ${pMessage.member.toString()}, please list the details of your shoutout below.`;
      break;
    case "contest":
      categoryId = CONTEST_CATEGORY_ID;
      moderatorRoleName = MODERATOR_ROLE_NAME;
      moderatorRoleId = SUPPORT_ROLE_ID;
      ticketMessage = `Hi ${pMessage.member.toString()}, please list the details of your contest below.`;
    default:
      break;
  }

  //! This comes to us in the format of "![fiyesta|shoutout] [close|logs]?"
  const args = pMessage.cleanContent.split(" ");
  if (
    args[1] &&
    !(args[1] == "close" || args[1] == "logs" || args[1] == "forceclose")
  ) {
    return;
  }
  let channelName = `${type}-${(
    pMessage.author.username + pMessage.author.discriminator
  ).toLowerCase()}`;
  const isForceClose = pMessage.cleanContent.split(" ")[1] == "forceclose";

  const isClose = pMessage.cleanContent.split(" ")[1] == "close";
  const supportRole = pMessage.guild.roles.cache.find(
    (r) => r.name == moderatorRoleName
  );

  if (isClose) {
    const ticketChannel = <Discord.TextChannel>pMessage.channel;
    if (ticketChannel.name.startsWith(type)) {
      if (isAuthorModerator(pMessage))
        createCloseMessage(ticketChannel, pMessage.author, TICKET_LOG_CHANNEL);
    }
    return;
  }

  if (isForceClose) {
    const ticketChannel = <Discord.TextChannel>pMessage.channel;
    if (ticketChannel.name.startsWith(type)) {
      if (isAuthorModerator(pMessage))
        closeTicket(ticketChannel, pMessage.author, TICKET_LOG_CHANNEL);
    }
  } else {
    pMessage.delete();
    const channelOptions: TextChannelOptions = {
      topic: "Support ticket for " + pMessage.member.user.username,
      type: "text",
      permissionOverwrites: [
        {
          id: pMessage.guild.id,
          deny: ["VIEW_CHANNEL"],
        },
        {
          id: pMessage.author.id,
          allow: ["VIEW_CHANNEL", "READ_MESSAGE_HISTORY", "SEND_MESSAGES"],
          deny: ["ADD_REACTIONS"],
        },
      ],
      parent: categoryId,
    };
    channelName = channelName.replace(/\s+/g, "-").toLowerCase();
    if (pMessage.guild.channels.cache.find((c) => c.name == channelName)) {
      pMessage.author.createDM().then((channel) => {
        channel.send(
          "You already have a ticket open, please close that one first before opening another."
        );
      });
      return;
    } else {
      const ticketChannel = await pMessage.guild.channels.create(
        channelName,
        channelOptions
      );

      ticketChannel.send(
        `${ticketMessage} A ${supportRole.toString()} will be with you as soon as possible.`
      );
    }
  }
}

async function closeTicket(
  c: Discord.TextChannel,
  m: Discord.User,
  lc: string
) {
  const text = await createOutput(c, m);
  const logChannel = <TextChannel>(
    c.guild.channels.cache.find((c) => c.name.startsWith(lc))
  );
  logChannel.send(text, { split: true });
  c.delete("Closed Ticket");
}

async function createOutput(
  c: Discord.TextChannel,
  m: Discord.User
): Promise<string> {
  let text: string = "**Ticket Log below for <@" + m.id + ">**\n";
  let lastDate = "";
  const output = (await c.messages.fetch())
    .map((message) => {
      let [year, month, date, hour, min] = timeConverter(
        message.createdTimestamp
      );
      let dateHeader = `** ____________${date} ${month} ${year}____________**\n`;
      if (lastDate != dateHeader) {
        text = text + dateHeader;
        lastDate = dateHeader;
      }
      year = year.toString().length == 1 ? `0${year}` : year;
      min = min.toString().length == 1 ? `0${min}` : min;
      return `*[${hour}:${min}]* **${message.author.username}**: ${message.cleanContent}`;
    })
    .reverse()
    .forEach((line) => (text = text + line + "\n"));
  return text;
}

async function createCloseMessage(
  c: TextChannel,
  m: User,
  TICKET_LOG_CHANNEL: string
) {
  let message = await c.send(
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
            dm.send(await createOutput(c, m), { split: true })
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
  var a = new Date(UNIX_timestamp);
  var months = [
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
  var year = a.getFullYear();
  var month = months[a.getMonth()];
  var date = a.getDate();
  var hour = a.getHours();
  var min = a.getMinutes();
  var sec = a.getSeconds();
  var time =
    date + " " + month + " " + year + " " + hour + ":" + min + ":" + sec;
  return [year, month, date, hour, min, sec];
}

interface TextChannelOptions {
  topic?: string;
  nsfw?: boolean;
  type?: "text";
  parent?: Discord.ChannelResolvable;
  permissionOverwrites?: Array<OverwriteResolvable>;
  options?: number;
  reason?: string;
}
