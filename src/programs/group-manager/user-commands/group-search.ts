import { ButtonStyle, ComponentType } from "discord-api-types/v10";
import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ButtonBuilder,
  ButtonInteraction,
  ChatInputCommandInteraction,
  EmbedBuilder,
  InteractionResponse,
} from "discord.js";
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

    const nextId = "group-search-next";
    const prevId = "group-search-prev";

    const flip = async (
      page: number,
      clickedButton: ButtonInteraction,
      interactionResponse: InteractionResponse
    ) => {
      if (page < 0) page = 0;
      if (page >= pages.length) page = pages.length - 1;

      await clickedButton.update({ embeds: [pages[page]] });
      await setupPaging(page, interactionResponse);
    };

    const setupPaging = async (
      currentPage: number,
      interactionResponse: InteractionResponse
    ) => {
      try {
        const clickedButton = await interactionResponse.awaitMessageComponent({
          componentType: ComponentType.Button,
          filter: (button) => button.user.id === interaction.user.id,
          time: 60_000,
          idle: 60_000,
          dispose: false,
          interactionResponse,
        });

        if (clickedButton.customId === prevId) {
          await flip(currentPage - 1, clickedButton, interactionResponse);
        } else if (clickedButton.customId === nextId) {
          await flip(currentPage + 1, clickedButton, interactionResponse);
        }
      } catch (error) {}
    };

    const components = new ActionRowBuilder<ButtonBuilder>({
      components: [
        new ButtonBuilder({
          customId: prevId,
          label: "Previous",
          style: ButtonStyle.Primary,
        }),
        new ButtonBuilder({
          customId: nextId,
          label: "Next",
          style: ButtonStyle.Primary,
        }),
      ],
    });

    const interactionReply = await interaction.reply({
      ephemeral: true,
      embeds: [pages[0]],
      components: pages.length > 1 ? [components] : undefined,
    });

    await setupPaging(0, interactionReply);
  }
}
