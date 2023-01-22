import {
  APIApplicationCommandBasicOption,
  APIApplicationCommandOptionChoice,
  ApplicationCommandOptionType,
  CategoryChannel,
  ChannelType,
  ChatInputCommandInteraction,
  GuildMember,
  OverwriteResolvable,
  OverwriteType,
  PermissionsBitField,
} from "discord.js";
import Tools from "../../../common/tools";
import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../../event-distribution";
import prisma from "../../../prisma";
import {
  ensureHasYesTheory,
  maxMembers,
  minMembers,
  permissionErrors,
  VoiceOnDemandErrors,
} from "../common";
import { VoiceOnDemandService } from "../voice-on-demand-service";

const channelTypes = [
  {
    emoji: "📹",
    label: "Video Call",
  },
  {
    emoji: "💬",
    label: "Just Chatting",
  },
  {
    emoji: "📺",
    label: "Watchparty",
  },
  {
    emoji: "🎲",
    label: "Gamenight",
  },
  {
    emoji: "🎵",
    label: "Jammin'",
  },
  {
    emoji: "🏋️",
    label: "Working out",
  },
];

const emojiChoices = channelTypes.map<
  APIApplicationCommandOptionChoice<string>
>(({ emoji, label }) => ({
  name: `${emoji} - ${label}`,
  value: emoji,
}));

@Command({
  event: DiscordEvent.SLASH_COMMAND,
  root: "voice",
  subCommand: "create",
  description: "Create your own voice room!",
  options: [
    {
      name: "emoji",
      type: ApplicationCommandOptionType.String,
      description: "The emoji for your channel",
      choices: emojiChoices,
      required: true,
    },
    {
      name: "limit",
      type: ApplicationCommandOptionType.Integer,
      min_value: minMembers,
      max_value: maxMembers,
      description: "The initial user-limit for your room",
    },
  ],
  errors: {
    ...permissionErrors,
    [VoiceOnDemandErrors.ALREADY_HAS_ROOM]:
      "You already have an existing voice channel!",
  },
})
export class VoiceCreate extends CommandHandler<DiscordEvent.SLASH_COMMAND> {
  private readonly vodService = new VoiceOnDemandService();

  async handle(interaction: ChatInputCommandInteraction): Promise<void> {
    ensureHasYesTheory(interaction);

    if (!interaction.guild) return;
    const userId = interaction.user.id;

    const existing = await this.vodService.mappingByUserId(userId);

    if (existing) throw new Error(VoiceOnDemandErrors.ALREADY_HAS_ROOM);

    const limit = interaction.options.getInteger("limit") ?? 5;
    const emoji = interaction.options.getString("emoji")!;

    const member = await interaction.guild.members.fetch(userId)!;

    const createdChannel = await this.createChannel(member, limit, emoji);
    const mapping = {
      userId,
      channelId: createdChannel.id,
      emoji,
    };

    await prisma.voiceOnDemandMapping.create({ data: mapping });

    await interaction.reply({
      content: `Your room was created with a limit of ${limit}, have fun! Don't forget, this channel will be deleted if there is noone in it. :smile:`,
      ephemeral: true,
    });

    await this.vodService.resetDeleteIfEmptyTimer(createdChannel.id);
  }

  private async createChannel(
    member: GuildMember,
    limit: number,
    emoji: string
  ) {
    const guild = member.guild;

    const parent = guild.channels.cache.find(
      (channel): channel is CategoryChannel =>
        channel.name.toLowerCase().includes("conversation") &&
        channel.type === ChannelType.GuildCategory
    );
    const overwrites = this.initialOverwrites(member);
    const name = this.vodService.getChannelName(member, emoji);

    return await guild.channels.create({
      name,
      type: ChannelType.GuildVoice,
      parent,
      userLimit: limit,
      permissionOverwrites: overwrites,
    });
  }

  private initialOverwrites(member: GuildMember) {
    const guild = member.guild;

    const timeoutRole = Tools.getRoleByName("Time Out", guild);
    const breakRole = Tools.getRoleByName("Break", guild);
    const overwrites: OverwriteResolvable[] = [
      {
        id: guild.roles.everyone,
        allow: [],
        deny: [PermissionsBitField.Flags.Connect],
        type: OverwriteType.Role,
      },
      {
        id: member.id,
        allow: [PermissionsBitField.Flags.Connect],
        deny: [],
        type: OverwriteType.Member,
      },
    ];

    if (timeoutRole) {
      overwrites.push({
        id: timeoutRole.id,
        deny: [PermissionsBitField.Flags.Connect],
        type: OverwriteType.Role,
      });
    }

    if (breakRole) {
      overwrites.push({
        id: breakRole.id,
        deny: [PermissionsBitField.Flags.ViewChannel],
        type: OverwriteType.Role,
      });
    }

    return overwrites;
  }
}
