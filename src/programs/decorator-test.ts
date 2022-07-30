import { ApplicationCommandOptionType } from "discord-api-types/payloads/v10";
import { ChatInputCommandInteraction } from "discord.js";
import { Command, CommandHandler, DiscordEvent } from "../event-distribution";

@Command({
  event: DiscordEvent.SLASH_COMMAND,
  root: "ping",
  description: "Sends pong :)",
})
class SlashCommandPing extends CommandHandler<DiscordEvent.SLASH_COMMAND> {
  async handle(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.reply({ content: "Ping", ephemeral: true });
    await new Promise((res) => setTimeout(res, 3000));
    await interaction.editReply("Uuuuuh, oops... I meant pong!");
  }
}

@Command({
  event: DiscordEvent.SLASH_COMMAND,
  root: "pong",
  description: "Sends ping * x :)",
  options: [
    {
      type: ApplicationCommandOptionType.Integer,
      name: "x",
      description: "How often to send ping",
      required: true,
      max_value: 5,
      min_value: 1,
    },
  ],
})
class SlashCommandPongWithOptions extends CommandHandler<DiscordEvent.SLASH_COMMAND> {
  async handle(interaction: ChatInputCommandInteraction): Promise<void> {
    const x = interaction.options.getInteger("x", true);

    const content = Array<string>(x).fill("ping").join(", ");

    await interaction.reply(content);
  }
}

@Command({
  event: DiscordEvent.SLASH_COMMAND,
  root: "sub",
  subCommand: "test1",
  description: "Seeing how sub commands behave",
})
class SlashCommandSub1 extends CommandHandler<DiscordEvent.SLASH_COMMAND> {
  async handle(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.reply("Test1!");
  }
}

@Command({
  event: DiscordEvent.SLASH_COMMAND,
  root: "sub",
  subCommand: "test2",
  description: "Seeing how sub commands behave",
})
class SlashCommandSub2 extends CommandHandler<DiscordEvent.SLASH_COMMAND> {
  async handle(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.reply("Test2!");
  }
}

@Command({
  event: DiscordEvent.SLASH_COMMAND,
  root: "root",
  subCommandGroup: "subcommandgroup1",
  subCommand: "subcommand1",
  description: "subsub1",
})
class SlashCommandSubSub1 extends CommandHandler<DiscordEvent.SLASH_COMMAND> {
  async handle(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.reply("subsub1");
  }
}

@Command({
  event: DiscordEvent.SLASH_COMMAND,
  root: "root",
  subCommandGroup: "subcommandgroup1",
  subCommand: "subcommand2",
  description: "subsub2",
})
class SlashCommandSubSub2 extends CommandHandler<DiscordEvent.SLASH_COMMAND> {
  async handle(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.reply("subsub2");
  }
}

@Command({
  event: DiscordEvent.SLASH_COMMAND,
  root: "root",
  subCommandGroup: "subcommandgroup2",
  subCommand: "subcommand1",
  description: "subsub3",
})
class SlashCommandSubSub3 extends CommandHandler<DiscordEvent.SLASH_COMMAND> {
  async handle(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.reply("subsub3");
  }
}

@Command({
  event: DiscordEvent.SLASH_COMMAND,
  root: "root",
  subCommandGroup: "subcommandgroup2",
  subCommand: "subcommand2",
  description: "subsub4",
})
class SlashCommandSubSub4 extends CommandHandler<DiscordEvent.SLASH_COMMAND> {
  async handle(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.reply("subsub4");
  }
}

// @Command({
//   event: DiscordEvent.SLASH_COMMAND,
//   trigger: "sub",
//   description: "Blablaerror",
// })
// class SlashCommandError extends CommandHandler<DiscordEvent.SLASH_COMMAND> {
//   async handle(interaction: CommandInteraction): Promise<void> {
//     await interaction.reply("Hold up this just works?!");
//   }
// }

// TODO possibly in the future two levels of subcommands
// Discord calls the first level command,
// the second subcommand if there are no further commands below
//    or subcommand-group if there are commands below
// and the third subcommand
