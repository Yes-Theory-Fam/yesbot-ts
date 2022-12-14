import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import { Paginator } from "../../../common/paginator";
import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../../event-distribution";
import {
  findManyRequestedGroups,
  GroupWithMemberRelationList,
} from "../common";

enum Errors {
  NO_GROUPS_FOUND = "NO_GROUPS_FOUND",
}

@Command({
  event: DiscordEvent.SLASH_COMMAND,
  root: "group",
  subCommand: "search",
  description: "List groups!",
  options: [
    {
      name: "name",
      description: "The name of the group",
      type: ApplicationCommandOptionType.String,
      required: false,
    },
  ],
  errors: {
    [Errors.NO_GROUPS_FOUND]: "No matching groups were found.",
  },
})
class SearchGroup implements CommandHandler<DiscordEvent.SLASH_COMMAND> {
  async handle(interaction: ChatInputCommandInteraction): Promise<void> {
    const requestedGroupName = interaction.options.getString("name") ?? "";

    const groupsPerPage = 4;
    const pages: Array<EmbedBuilder> = [];
    const byMemberCount = (
      a: GroupWithMemberRelationList,
      b: GroupWithMemberRelationList
    ) =>
      b.userGroupMembersGroupMembers.length -
      a.userGroupMembersGroupMembers.length;

    const copy = (await findManyRequestedGroups(requestedGroupName)).sort(
      byMemberCount
    );

    if (copy.length === 0) {
      throw new Error(Errors.NO_GROUPS_FOUND);
    }

    const pageAmount = Math.ceil(copy.length / groupsPerPage);

    const yesBotAvatarUrl = interaction.client.user?.avatarURL({
      size: 256,
      extension: "png",
    });

    for (let i = 0; i < pageAmount; i++) {
      const embed = new EmbedBuilder().setAuthor({
        name: "YesBot",
        iconURL: yesBotAvatarUrl ?? "https://example.com/invalid.png",
      });
      const resultsSentence =
        requestedGroupName == undefined
          ? "Results for all groups"
          : `Results for group ${requestedGroupName}`;
      embed.setDescription(
        `${resultsSentence} (Page ${i + 1} / ${pageAmount})`
      );

      const chunk = copy.splice(0, groupsPerPage);

      const totalFields = chunk.flatMap((group) => [
        { name: "Group Name:", value: group.name, inline: true },
        {
          name: "Number of Members:",
          value: group.userGroupMembersGroupMembers.length.toString(),
          inline: true,
        },
        { name: "Description:", value: group.description || "-" },
        { name: "\u200B", value: "\u200B" },
      ]);

      embed.setFields(totalFields);

      pages.push(embed);
    }

    const paginator = new Paginator(pages, interaction, 'group-search');
    await paginator.paginate();
  }
}
