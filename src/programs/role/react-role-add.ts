import {
  APIRole,
  ApplicationCommandOptionType,
  Channel,
  ChannelType,
  ChatInputCommandInteraction,
  EmbedBuilder,
  Message,
  Role,
  TextChannel,
} from "discord.js";
import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../event-distribution";
import { createYesBotLogger } from "../../log";
import prisma from "../../prisma";

const logger = createYesBotLogger("programs", "role-add");

enum Errors {
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
  MESSAGE_NOT_FOUND = "MESSAGE_NOT_FOUND",
}

@Command({
  event: DiscordEvent.SLASH_COMMAND,
  root: "role",
  subCommand: "add",
  description: "Add a reaction-role",
  options: [
    {
      name: 'emoji',
      type: ApplicationCommandOptionType.String,
      description: 'The emoji for the reaction',
      required: true,
    },
    {
      name: 'role',
      type: ApplicationCommandOptionType.Role,
      description: 'The applied role',
      required: true,
    },
    {
      name: 'channel',
      type: ApplicationCommandOptionType.Channel,
      channel_types: [ChannelType.GuildText],
      description: 'The channel I can find the message in',
      required: true,
    },
    {
      name: 'message-id',
      type: ApplicationCommandOptionType.String,
      description: 'The ID of the message to add the reaction to',
      required: true,
    },
  ],
  errors: {
    [Errors.MESSAGE_NOT_FOUND]: "I could not find that message. Are you sure the ID is correct?",
    [Errors.UNKNOWN_ERROR]: "I could not create that reaction-role.",
  },
})
class AddReactRoleObject implements CommandHandler<DiscordEvent.SLASH_COMMAND> {
  async handle(interaction: ChatInputCommandInteraction): Promise<void> {
    const emoji = interaction.options.getString("emoji")!;
    const role = interaction.options.getRole("role")!;
    const channel = interaction.options.getChannel("channel")! as TextChannel;
    const messageId = interaction.options.getString("message-id")!;

    const requestedMessage = await channel.messages.fetch(messageId);
    if (!requestedMessage) throw new Error(Errors.MESSAGE_NOT_FOUND);

    await addReactRoleObject(
      interaction,
      channel,
      emoji,
      role,
      requestedMessage
    );
  }
}

const addReactRoleObject = async (
  interaction: ChatInputCommandInteraction,
  channel: Channel,
  emoji: string,
  role: Role | APIRole,
  referencedMessage: Message
) => {
  const referencedMessageId = referencedMessage.id;
  const channelId = channel.id;

  const reactRoleObject = {
    messageId: referencedMessageId,
    channelId: channelId,
    roleId: role.id,
    reaction: emoji,
  };

  try {
    await prisma.reactionRole.create({ data: reactRoleObject });
  } catch (err) {
    logger.error("Failed to create role object: ", err);
    throw new Error(Errors.UNKNOWN_ERROR);
  }

  await referencedMessage.react(emoji);
  const successEmbed = new EmbedBuilder()
    .setColor("#ff6063")
    .setTitle("Reaction role successfully added.")
    .setFields([
      { name: "\u200b", value: "\u200b" },

      { name: "Target Message:", value: referencedMessage.cleanContent, inline: true },
      { name: "Target Channel:", value: channel.toString(), inline: true },
      { name: "Necessary Reaction:", value: emoji, inline: true },
      { name: "Reward Role:", value: role.toString(), inline: true },
    ]);
  await interaction.reply({ephemeral: true, embeds: [successEmbed]});
};
