import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../event-distribution/index.js";
import {
  ApplicationCommandOptionType,
  ChannelType,
  ChatInputCommandInteraction,
} from "discord.js";
import Tools from "../../common/tools.js";

const enum Errors {
  NOT_IN_GUILD = "NOT_IN_GUILD",
  SUPPORT_NOT_FOUND = "SUPPORT_NOT_FOUND",
}

@Command({
  event: DiscordEvent.SLASH_COMMAND,
  root: "lock",
  description: "Quickly lock a chat if it starts getting out of hand",
  options: [
    {
      type: ApplicationCommandOptionType.Channel,
      description: "The channel to lock",
      name: "channel",
      required: false,
    },
  ],
  errors: {
    [Errors.NOT_IN_GUILD]: "The command can only be used on a server!",
  },
})
class LockChannel extends CommandHandler<DiscordEvent.SLASH_COMMAND> {
  async handle(interaction: ChatInputCommandInteraction): Promise<void> {
    const channelOption = interaction.options.getChannel("channel");
    const optionChannel =
      interaction.guild && channelOption
        ? await interaction.guild.channels.fetch(channelOption.id)
        : undefined;

    const channel = optionChannel ?? interaction.channel;
    if (channel?.type !== ChannelType.GuildText) {
      throw new Error(Errors.NOT_IN_GUILD);
    }

    await interaction.deferReply({ ephemeral: true });

    const support = Tools.getRoleByName("Support", channel.guild);
    if (!support) {
      throw new Error(Errors.SUPPORT_NOT_FOUND);
    }

    await channel.permissionOverwrites.create(support, {
      SendMessages: true,
    });
    await channel.permissionOverwrites.edit(channel.guild.roles.everyone, {
      SendMessages: false,
    });

    await channel.send("This channel has been temporarily locked!");

    await interaction.editReply({
      content:
        "The channel has been locked. Go to its permissions and set 'Send Messages' for the Member or everyone role **TO NEUTRAL** unlock it!",
    });
  }
}
