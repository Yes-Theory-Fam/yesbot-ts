import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  TextChannel,
} from "discord.js";
import { Paginator } from "../../common/paginator.js";
import prisma from "../../prisma.js";
import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../event-distribution/index.js";

@Command({
  event: DiscordEvent.SLASH_COMMAND,
  root: "role",
  subCommand: "list",
  description: "List the available reaction-roles",
})
class ListReactRoleObjects
  implements CommandHandler<DiscordEvent.SLASH_COMMAND>
{
  async handle(interaction: ChatInputCommandInteraction): Promise<void> {
    const guild = interaction.guild;
    if (!guild) return;

    const reactRoleObjects = [
      ...(await prisma.reactionRole.findMany({
        orderBy: { id: "asc" },
      })),
    ];

    if (reactRoleObjects.length === 0) {
      await interaction.reply("There are no reaction-roles defined.");
      return;
    }

    const rolesPerPage = 4;
    const yesBotAvatarUrl = interaction.client.user?.avatarURL({
      size: 256,
      extension: "png",
    });

    const pageAmount = Math.ceil(reactRoleObjects.length / rolesPerPage);

    const pages: EmbedBuilder[] = [];
    for (let i = 0; i < pageAmount; i++) {
      const embed = new EmbedBuilder().setAuthor({
        name: "YesBot",
        iconURL: yesBotAvatarUrl ?? "https://example.com/invalid.png",
      });

      embed.setDescription(`Reaction-Roles (Page ${i + 1} / ${pageAmount})`);

      const chunk = reactRoleObjects.splice(0, rolesPerPage);
      const allFields = chunk.flatMap((reactionRole) => {
        const roleName =
          guild.roles.resolve(reactionRole.roleId)?.name ?? "Deleted role";
        const channel = guild.channels.resolve(
          reactionRole.channelId
        ) as TextChannel | null;

        const messageUrl = `https://discord.com/channels/${guild.id}/${reactionRole.channelId}/${reactionRole.messageId}`;

        const channelName = channel?.name ?? "Deleted channel";
        const messageValue = `[Link](${messageUrl}) (#${channelName})`;

        return [
          { name: "Message", value: messageValue, inline: true },
          { name: "Reaction", value: reactionRole.reaction, inline: true },
          { name: "Role", value: roleName },
          { name: "\u200B", value: "\u200B" },
        ];
      });

      embed.setFields(allFields);

      pages.push(embed);
    }

    const paginator = new Paginator(pages, interaction, "react-role-list");
    await paginator.paginate();
  }
}
