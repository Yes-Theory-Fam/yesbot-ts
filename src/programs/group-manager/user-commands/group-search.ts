import { Message, MessageEmbed, MessageReaction, User } from "discord.js";
import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../../event-distribution";
import prisma from "../../../prisma";
import { GroupWithMemberRelationList } from "../common";

@Command({
  event: DiscordEvent.MESSAGE,
  trigger: "!group",
  subTrigger: "search",
  channelNames: ["bot-commands", "permanent-testing"],
  description: "This handler is to search all groups or the specified group",
})
class SearchGroup implements CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message): Promise<void> {
    const words = message.content.split(" ").slice(2);
    const requestedGroupName = words[0];

    const groupsPerPage = 4;
    const pages: Array<MessageEmbed> = [];
    const byMemberCount = (
      a: GroupWithMemberRelationList,
      b: GroupWithMemberRelationList
    ) =>
      b.userGroupMembersGroupMembers.length -
      a.userGroupMembersGroupMembers.length;

    const copy = (
      await prisma.userGroup.findMany({
        where: {
          name: {
            contains: requestedGroupName,
            mode: "insensitive",
          },
        },
        include: { userGroupMembersGroupMembers: true },
      })
    ).sort(byMemberCount);

    if (copy.length === 0) {
      await message.reply("No matching groups were found.");
      return;
    }

    const pageAmount = Math.ceil(copy.length / groupsPerPage);

    for (let i = 0; i < pageAmount; i++) {
      const embed = new MessageEmbed({}).setAuthor(
        "YesBot",
        "https://cdn.discordapp.com/avatars/614101602046836776/61d02233797a400bc0e360098e3fe9cb.png?size=$%7BrequestedImageSize%7D"
      );
      embed.setDescription(
        `Results for group "${requestedGroupName}" (Page ${
          i + 1
        } / ${pageAmount})`
      );

      const chunk = copy.splice(0, groupsPerPage);

      chunk.forEach((group) => {
        embed.addField("Group Name:", group.name, true);
        embed.addField(
          "Number of Members:",
          group.userGroupMembersGroupMembers.length,
          true
        );
        embed.addField("Description", group.description || "-");
        embed.addField("\u200B", "\u200B");
      });

      pages.push(embed);
    }

    const flip = async (
      page: number,
      shownPageMessage: Message,
      reaction: MessageReaction
    ) => {
      if (page < 0) page = 0;
      if (page >= pages.length) page = pages.length - 1;

      await shownPageMessage.edit(message.author.toString(), {
        embed: pages[page],
      });
      await reaction.users.remove(message.author.id);
      await setupPaging(page, shownPageMessage);
    };

    const setupPaging = async (currentPage: number, pagedMessage: Message) => {
      const filter = (reaction: MessageReaction, user: User) => {
        return (
          ["⬅️", "➡️"].includes(reaction.emoji.name) &&
          user.id === message.author.id
        );
      };

      try {
        const reactions = await pagedMessage.awaitReactions(filter, {
          max: 1,
          time: 60000,
          errors: ["time"],
        });
        const first = reactions.first();
        if (first.emoji.name === "⬅️") {
          await flip(currentPage - 1, pagedMessage, first);
        }
        if (first.emoji.name === "➡️") {
          await flip(currentPage + 1, pagedMessage, first);
        }
      } catch (error) {}
    };

    const sentMessagePromise = message.channel.send(pages[0]);
    if (pages.length > 1) {
      sentMessagePromise
        .then(async (msg) => {
          await msg.react("⬅️");
          await msg.react("➡️");
          return msg;
        })
        .then((msg) => setupPaging(0, msg));
    }
  }
}
